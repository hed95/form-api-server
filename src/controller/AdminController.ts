import * as express from 'express';
import {inject} from 'inversify';
import {
    BaseHttpController,
    controller,
    httpGet,
    httpPost,
    queryParam,
    request,
    requestBody,
    response,
} from 'inversify-express-utils';
import TYPE from '../constant/TYPE';
import {FormService} from '../service/FormService';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import AppConfig from '../interfaces/AppConfig';
import HttpStatus from 'http-status-codes';
import * as Joi from '@hapi/joi';
import {ValidationResult} from '@hapi/joi';
import ResourceValidationError from '../error/ResourceValidationError';

@controller('/admin')
export class AdminController extends BaseHttpController {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        super();
    }

    @httpGet('/forms', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public async allForms(@request() req: express.Request,
                          @response() res: express.Response,
                          @queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0): Promise<void> {
        const result: { total: number, versions: FormVersion[] } = await this.formService.allForms(limit, offset);
        res.json(result);
    }

    @httpPost('/log', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public changeLogLevel(@requestBody() logLevel: object, @response() res: express.Response): void {
        if (!this.appConfig.log.enabled) {
            res.sendStatus(HttpStatus.FORBIDDEN);
        } else {
            // @ts-ignore
            const level = logLevel.level;

            const result: ValidationResult<object> = Joi.object().keys({
                level: Joi.string().valid('info', 'debug', 'warn', 'error').required(),
            }).validate(logLevel);

            if (result.error) {
                throw new ResourceValidationError('Invalid log', result.error.details);
            }
            const transportStream = logger.transports[0];
            logger.warn(`Changing log level from ${transportStream.level} to ${level}.`);
            transportStream.level = level;
            res.sendStatus(HttpStatus.OK);

            if (this.appConfig.log.timeout !== -1) {
                setTimeout(() => {
                    logger.warn(`Reverting log level back info`);
                    transportStream.level = 'info';
                }, this.appConfig.log.timeout);
            }
        }
    }
}
