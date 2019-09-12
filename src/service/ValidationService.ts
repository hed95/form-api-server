import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import {FormService} from './FormService';
import {User} from '../auth/User';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import ResourceValidationError from '../error/ResourceValidationError';
import {KeycloakService} from '../auth/KeycloakService';
import {Validator} from '../formio/Validator';

@provide(TYPE.ValidationService)
export class ValidationService {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService,
                @inject(TYPE.KeycloakService) private readonly keycloakService: KeycloakService) {
    }

    public async validate(formId: string, submission: any, user: User): Promise<Error[]> {
        const form: FormVersion = await this.formService.findLatestForm(formId, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${formId} not found`);
        }
        if (!submission.data) {
            logger.warn(`No submission data provided for validation`);
            throw new ResourceValidationError(`No submission data provided`, [{
                message: 'No submission data provided to validate',
                path: ['data'],
                type: 'required',
                context: {},
            }]);
        }
        const token = this.keycloakService.token();

        const validator = new Validator(form.schema, submission.data, token);

        const validationErrors: Error[] = await new Promise((resolve, reject) => {
            validator.validate(submission, (vErrors, data) => {
                if (vErrors) {
                    if (Array.isArray(vErrors)) {
                        resolve(vErrors);
                    } else {
                        resolve([vErrors]);
                    }
                } else {
                    resolve([]);
                }
            });
        });
        logger.info(`Validation errors ${validationErrors.length}`);
        return Promise.resolve(validationErrors);
    }

}
