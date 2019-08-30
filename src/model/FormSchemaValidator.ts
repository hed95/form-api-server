import * as Joi from '@hapi/joi';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import util from 'formiojs/utils';
import _ from 'lodash';

@provide(TYPE.FormSchemaValidator)
export class FormSchemaValidator {

    public validate(payload: any): Joi.ValidationResult<object> {
        const validationResult = Joi.validate(payload, this.schema(), {
            abortEarly: false,
        });
        const msg: string = 'Component keys must be unique: ';
        const paths = this.componentPaths(payload.components);
        const uniq = paths.uniq();
        const diff = paths.filter((value: any, index: any, collection: any) =>
            _.includes(collection, value, index + 1));

        if (!_.isEqual(paths.value(), uniq.value())) {
            if (!validationResult.error) {
                const details: Joi.ValidationErrorItem[] = [];
                // @ts-ignore
                validationResult.error = {
                    details,
                };
            }
            validationResult.error.details.push({
                message: msg + diff.value().join(', '),
                type: 'unique component keys',
                path: diff.value(),
            });
        }
        return validationResult;
    }

    private componentPaths(components: object[]): any {
        const paths: string[] = [];
        util.eachComponent(components, (component: object, path: string) => {
            // @ts-ignore
            if (component.input && !_.isUndefined(component.key) && !_.isNull(component.key)) {
                paths.push(path);
            }
        }, true);

        return _(paths);
    }

    private schema(): object {
        return Joi.object().keys({
            id: Joi.string(),
            _id: Joi.string(),
            name: Joi.string().required(),
            title: Joi.string().required(),
            path: Joi.string().required(),
            components: Joi.any().allow(),
            type: Joi.string(),
            tags: Joi.array().items(Joi.string()).allow(),
            owner: Joi.string().allow(),
            display: Joi.string().valid('form', 'wizard', 'pdf'),
            access: Joi.array().items(Joi.any()),
            submissionAccess: Joi.array().items(Joi.any()),
            createdOn: Joi.date(),
            updatedOn: Joi.date(),
            createdBy: Joi.string(),
            updatedBy: Joi.string(),
            versionId: Joi.string(),
            created: Joi.string(),
            modified: Joi.string(),
            latest: Joi.boolean().optional()
        });
    }
}
