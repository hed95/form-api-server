import * as Joi from '@hapi/joi';
import {ValidationResult} from '@hapi/joi';
import AppConfig from '../interfaces/AppConfig';

export class ConfigValidator {
    private readonly schema: Joi.Schema;

    constructor() {
        this.schema = Joi.object().keys({
            keycloak: Joi.object({
                url: Joi.string().required(),
                resource: Joi.string().required(),
                realm: Joi.string().required(),
                bearerOnly: Joi.string(),
                sslRequired: Joi.string(),
                confidentialPort: Joi.number(),
                tokenRefreshInterval: Joi.string(),
                admin: Joi.object().keys({
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                    clientId: Joi.string(),
                }),
            }),
            admin: Joi.object().keys({
                roles: Joi.array().items(Joi.string()),
            }),
            cors: Joi.object().keys({
                origin: Joi.array().items(Joi.string()),
            }),
            log: Joi.object().keys({
                enabled: Joi.boolean(),
                timeout: Joi.any().optional(),
            }),
            cache: Joi.object().keys({
                form: Joi.object().keys({
                    maxAge: Joi.number(),
                    maxEntries: Joi.number(),
                }),
                user: Joi.object().keys({
                    maxAge: Joi.number(),
                    maxEntries: Joi.number(),
                }),
            }),
            correlationIdRequestHeader: Joi.string(),
        });
    }

    public validate(config: AppConfig): ValidationResult<any> {
        return Joi.validate(config, this.schema, {abortEarly: false});
    }
}
