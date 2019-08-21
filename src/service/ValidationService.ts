import {ValidationError} from '@hapi/joi';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import {FormService} from './FormService';
import {User} from '../auth/User';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import {util} from '../formio/Util';
import vm from 'vm';
import _ from 'lodash';
import moment from 'moment';
import {JoiX} from '../formio/JoiX';
import ResourceValidationError from '../error/ResourceValidationError';

@provide(TYPE.ValidationService)
export class ValidationService {

    private readonly stringValidators: any = {
        minLength: 'min',
        maxLength: 'max',
        minWords: 'minWords',
        maxWords: 'maxWords',
    };

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {}

    public async validate(formId: string, submission: any, user: User): Promise<ValidationError[]> {
        const form: FormVersion = await this.formService.findLatestForm(formId, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${formId} not found`);
        }
        // @ts-ignore
        if (!submission.data) {
            logger.warn(`No submission data provided for validation`);
            throw new ResourceValidationError(`No submission data provided`, [{
                message: 'No submission data provided to validate',
                path: ['data'],
                type: 'required',
                context: {},
            }]);
        }
        // @ts-ignore
        const schema = this.buildSchema({}, form.schema.components, submission.data, submission);

        const validationErrors: ValidationError[] = [];
        await JoiX.validate(submission.data, schema, {stripUnknown: true, abortEarly: false},
                (validationError: ValidationError, value: object) => {
                if (validationError) {
                    validationErrors.push(validationError);
                }
            });

        logger.info(`Validation errors ${validationErrors.length}`);
        return Promise.resolve(validationErrors);
    }

    private applyLogic(component: any, row: any, data: any): void {
        if (!Array.isArray(component.logic)) {
            return;
        }

        component.logic.forEach((logic: any) => {
            const result = util.checkTrigger(component, logic.trigger, row, data);

            if (result) {
                if (!Array.isArray(logic.actions)) {
                    return;
                }
                logic.actions.forEach((action: any) => {
                    switch (action.type) {
                        case 'property':
                            util.setActionProperty(component, action, row, data, component, result);
                            break;
                        case 'value':
                            try {
                                // Create the sandbox.
                                const sandbox = vm.createContext({
                                    value: _.get(row, component.key),
                                    data,
                                    row,
                                    component,
                                    result,
                                });

                                // Execute the script.
                                const script = new vm.Script(action.value);
                                script.runInContext(sandbox, {
                                    timeout: 250,
                                });

                                _.set(row, component.key, sandbox.value.toString());
                            } catch (e) {
                                logger.error(e);
                            }
                            break;
                    }
                });
            }
        });
    }

    private calculateValue(component: any, row: any, data: any): void {
        if (component.calculateServer && component.calculateValue) {
            if (_.isString(component.calculateValue)) {
                try {
                    const sandbox = vm.createContext({
                        value: _.get(row, component.key),
                        data,
                        row,
                        component,
                        util,
                        moment,
                    });

                    // Execute the script.
                    const script = new vm.Script(component.calculateValue);
                    script.runInContext(sandbox, {
                        timeout: 250,
                    });

                    _.set(row, component.key, sandbox.value);
                } catch (e) {
                    logger.error('Failed to evaluate calculatedValue', e);
                }
            } else {
                try {
                    _.set(row, component.key, util.jsonLogic(component.calculateValue, {
                        data,
                        row,
                        _,
                    }));
                } catch (e) {
                    logger.error('Failed to evaluate calculatedValue', e);
                }
            }
        }
    }

    private buildSchema(schema: any, components: any, componentData: any, submission: any): object {

        if (!Array.isArray(components)) {
            return {};
        }
        components.forEach((component: any) => {
            let fieldValidator: any = null;
            this.applyLogic(component, componentData, submission);
            this.calculateValue(component, componentData, submission);

            const isPersistent = !component.hasOwnProperty('persistent') || component.persistent;

            switch (component.type) {
                case 'editgrid':
                case 'datagrid':
                    fieldValidator = this.dataGridValidator(component, componentData, submission);
                    break;
                case 'container':
                    fieldValidator = this.containerValidator(component, componentData, submission);
                    break;
                case 'fieldset':
                case 'panel':
                case 'well':
                    this.buildSchema(schema, component.components, componentData, submission);
                    break;
                case 'table':
                    if (!Array.isArray(component.rows)) {
                        break;
                    }
                    component.rows.forEach((row: any) => {
                        if (!Array.isArray(row)) {
                            return;
                        }
                        row.forEach((column: any) => {
                            this.buildSchema(schema, column.components, componentData, submission);
                        });
                    });
                    break;
                case 'columns':
                    if (!Array.isArray(component.columns)) {
                        break;
                    }
                    component.columns.forEach((column: any) => {
                        this.buildSchema(schema, column.components, componentData, submission);
                    });
                    break;
                case 'textfield':
                case 'textarea':
                case 'phonenumber':
                    fieldValidator = this.textFieldValidator(component);
                    break;
                case 'signature':
                    fieldValidator = JoiX.string().allow('');
                    break;
                case 'checkbox':
                    if (component.name && !_.find(components, ['key', component.name])) {
                        schema[component.name] = JoiX.any();
                    }
                    fieldValidator = fieldValidator || JoiX.any();
                    break;
                case 'number':
                    fieldValidator = this.numberValidator(component);
                    break;
                case 'email':
                    fieldValidator = JoiX.string().email().allow('');
                    break;
                default:
                    fieldValidator = this.defaultValidator(component,
                        componentData, submission, schema);
                    break;
            }
            fieldValidator = this.applyValidate(component, fieldValidator, submission);
            fieldValidator = this.applyAllowMultipleMasks(component, fieldValidator);
            fieldValidator = this.applyMultipleComponent(component, fieldValidator);
            // Only run validations for persistent fields.
            if (component.key && fieldValidator && isPersistent) {
                schema[component.key] = fieldValidator.hidden(component, submission.data);
            }
        });

        return schema;

    }

    private applyAllowMultipleMasks(component: any, fieldValidator: any) {
        // if multiple masks input, then data is object with 'value' field, and validation should be applied
        // to that field
        if (component.allowMultipleMasks) {
            fieldValidator = JoiX.object().keys({
                value: fieldValidator,
                maskName: JoiX.string(),
            });
            // additionally apply required rule to the field itself
            if (component.validate && component.validate.required) {
                fieldValidator = fieldValidator.required();
            }
        }
        return fieldValidator;
    }

    private applyMultipleComponent(component: any, fieldValidator: any) {
        // Make sure to change this to an array if multiple is checked.
        if (component.multiple) {
            // Allow(null) was added since some text fields have empty strings converted to null when multiple
            // which then
            // throws an error on re-validation. Allowing null fixes the issue.
            fieldValidator = JoiX.array().sparse().items(fieldValidator.allow(null)).options({stripUnknown: false});
            // If a multi-value is required, make sure there is at least one.
            if (component.validate && component.validate.required) {
                fieldValidator = fieldValidator.min(1).required();
            }
        }
        return fieldValidator;
    }

    /* tslint:disable */
    private numberValidator(component: any) {
        let fieldValidator = JoiX.number().empty(null);
        if (component.validate) {
            // If the step is provided... we can infer float vs. integer.
            if (component.validate.step && (component.validate.step !== 'any')) {
                const parts = component.validate.step.split('.');
                if (parts.length === 1) {
                    fieldValidator = fieldValidator.integer();
                } else {
                    fieldValidator = fieldValidator.precision(parts[1].length);
                }
            }
            _.each(['min', 'max', 'greater', 'less'], (check) => {
                if (component.validate.hasOwnProperty(check) && _.isNumber(component.validate[check])) {
                    fieldValidator = fieldValidator[check](component.validate[check]);
                }
            });
        }

        return fieldValidator;
    }
    /* tslint:enable */

    private containerValidator(component: any, componentData: any, submission: any) {
        let fieldValidator;
        const objectSchema: any = this.buildSchema(
            {},
            component.components,
            _.get(componentData, component.key, componentData),
            submission,
        );
        fieldValidator = JoiX.object().keys(objectSchema);
        return fieldValidator;
    }

    private dataGridValidator(component: any,
                              componentData: any,
                              submission: any) {
        component.multiple = false;
        const objectSchema: any = this.buildSchema(
            {},
            component.components,
            _.get(componentData, component.key, componentData),
            submission,
        );
        return JoiX.array().items(JoiX.object().keys(objectSchema)).options({stripUnknown: false});
    }

    private textFieldValidator(component: any) {
        let fieldValidator: any;
        if (component.as === 'json') {
            fieldValidator = JoiX.object();
        } else {
            fieldValidator = JoiX.string().allow('');
            Object.keys(this.stringValidators).forEach((key: string) => {
                const funcName = this.stringValidators[key];
                if (
                    component.validate &&
                    component.validate.hasOwnProperty(key) &&
                    _.isNumber(component.validate[key]) &&
                    component.validate[key] >= 0
                ) {
                    fieldValidator = fieldValidator[funcName](component.validate[key]);
                }
            });
        }
        return fieldValidator;
    }

    private defaultValidator(component: any, componentData: any,
                             submission: any, schema: any) {
        let fieldValidator = null;
        if (component.components && Array.isArray(component.components)) {
            if (component.tree) {
                const objectSchema: any = this.buildSchema(
                    {},
                    component.components,
                    _.get(componentData, component.key, componentData),
                    submission,
                );
                fieldValidator = JoiX.object().keys(objectSchema);
            } else {
                this.buildSchema(
                    schema,
                    component.components,
                    componentData,
                    submission,
                );
            }
        }
        return fieldValidator || JoiX.any();
    }

    private applyValidate(component: any, fieldValidator: any, submission: any) {
        if (component.key && (component.key.indexOf('.') === -1) && component.validate) {
            // Add required validator.
            if (component.validate.required) {
                fieldValidator = fieldValidator.required().empty().disallow('', null);
            }
            // Add regex validator
            if (component.validate.pattern) {
                try {
                    const regex = new RegExp(component.validate.pattern);
                    fieldValidator = fieldValidator.regex(regex);
                } catch (err) {
                    logger.error(err);
                }
            }
            // Add the custom validations.
            if (component.validate && component.validate.custom) {
                fieldValidator = fieldValidator.custom(component, submission.data);
            }
            // Add the json logic validations.
            if (component.validate && component.validate.json) {
                fieldValidator = fieldValidator.json(component, submission.data);
            }
        }
        return fieldValidator;
    }
}
