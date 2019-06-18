import {ValidationErrorItem} from '@hapi/joi';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import {FormService} from './FormService';
import {User} from '../auth/User';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import ValidationError from '../error/ValidationError';

@provide(TYPE.ValidationService)
export class ValidationService {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {

    }

    public async validate(formId: string, submission: object, user: User): Promise<ValidationErrorItem[]> {

        const form: FormVersion = await this.formService.findForm(formId, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${formId} not found`);
        }

        // @ts-ignore
        if (!submission.data) {
            logger.warning(`No submission data provided for validation`);
            throw new ValidationError(`No submission data provided`, [{
                message : 'No submission data provided to validate',
                path: ['data'],
                type: 'required',
                context: {},
            }]);
        }
        return null;
    }

}
