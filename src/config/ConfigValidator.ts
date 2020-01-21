import * as Joi from '@hapi/joi';
import AppConfig from '../interfaces/AppConfig';

export class ConfigValidator {
    private readonly schema: Joi.Schema;

    constructor() {
        this.schema = Joi.object().keys({
            dataContextPluginLocation: Joi.string().optional(),
            dataContextPluginExecutionTimeout: Joi.string().optional(),
            businessKey: Joi.object({
                enabled: Joi.bool().default(false),
                prefix: Joi.string().optional(),
            }),
            keycloak: Joi.object({
                protocol: Joi.string().required(),
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
            cors: Joi.object().optional().keys({
                origin: Joi.array().optional().items(Joi.string()),
            }),
            log: Joi.object().keys({
                enabled: Joi.boolean(),
                timeout: Joi.any().optional(),
            }),
            cache: Joi.object().keys({
                role: Joi.object().keys({
                    maxAge: Joi.number(),
                    maxEntries: Joi.number(),
                }),
                form: Joi.object().keys({
                    maxAge: Joi.number(),
                    maxEntries: Joi.number(),
                }),
                user: Joi.object().keys({
                    maxAge: Joi.number(),
                    maxEntries: Joi.number(),
                }),
            }),
            redis: Joi.object().keys({
               port: Joi.number(),
               host: Joi.string(),
               token: Joi.string(),
               ssl: Joi.boolean(),
            }),
            query: Joi.object().keys({
                log: Joi.object().keys({
                    enabled: Joi.boolean(),
                }),
            }),
            correlationIdRequestHeader: Joi.string(),
        });
    }

    public validate(config: AppConfig): Joi.ValidationResult<any> {
        return Joi.validate(config, this.schema, {abortEarly: false});
    }
}
