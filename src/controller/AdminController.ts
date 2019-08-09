import * as express from 'express';
import {inject} from 'inversify';
import {
    BaseHttpController,
    controller,
    httpDelete,
    httpGet,
    httpPost,
    principal,
    queryParam,
    request,
    requestBody,
    requestParam,
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
import {User} from '../auth/User';
import {KeycloakService} from '../auth/KeycloakService';
import {LRUCacheClient} from '../service/LRUCacheClient';
import {EventEmitter} from 'events';
import {ApplicationConstants} from '../constant/ApplicationConstants';
import {SequelizeProvider} from '../model/SequelizeProvider';
import {
    ApiOperationDelete,
    ApiOperationGet,
    ApiOperationPost,
    ApiPath,
    SwaggerDefinitionConstant,
} from 'swagger-express-ts';

@ApiPath({
    path: '/admin',
    name: 'Admin',
    description: 'Admin APIs can be invoked with the appropriate roles. See your application configuration',
    security: {bearerAuth: []},
})
@controller('/admin')
export class AdminController extends BaseHttpController {

    public timeoutId: any;

    constructor(@inject(TYPE.FormService) private readonly formService: FormService,
                @inject(TYPE.KeycloakService) private readonly keycloakService: KeycloakService,
                @inject(TYPE.LRUCacheClient) private readonly lruCacheClient: LRUCacheClient,
                @inject(TYPE.EventEmitter) private readonly eventEmitter: EventEmitter,
                @inject(TYPE.SequelizeProvider) private readonly sequlizeProvider: SequelizeProvider,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        super();

        this.eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            logger.info('Clearing timeout in Admin controller');
            this.clearTimeout();
        });
    }

    @ApiOperationGet({
        path: '/forms',
        description: 'Returns all form versions without any pre processing',
        summary: 'Returns all form versions without any pre processing',
        parameters: {
            query: {
                limit: {
                    description: 'Limit the number of results returned per page',
                    type: 'number',
                    required: false,
                    default: 20,
                },
                offset: {
                    description: 'Page number',
                    type: 'number',
                    required: false,
                    default: 0,
                },

            },
        },
        responses: {
            200: {
                description: 'Form versions',
                model: 'FormVersion',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
        },
    })
    @httpGet('/forms', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public async allForms(@request() req: express.Request,
                          @response() res: express.Response,
                          @queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0): Promise<void> {
        const result: { total: number, versions: FormVersion[] } = await this.formService.allForms(limit, offset);
        res.json(result);
    }

    @ApiOperationPost({
        path: '/log',
        description: 'Use to change log level',
        summary: 'You can change the log level  of the ' +
            'running application (\'info\', \'debug\', \'warn\', \'error\'). ' +
            'Based on the configuration the log will revert back to default (DEBUG) after the configured timeout. ' +
            'See application configuration',
        parameters: {
            body: {
                required: true,

                properties: {
                    level: {
                        type: 'string',
                        required: true,
                    },
                },
            },

        },
        responses: {
            200: {
                description: 'Successfully changed the log level',
            },
            400: {
              description: 'Invalid log level. Use \'info\', \'debug\', \'warn\' or \'error\'',
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
        },
    })
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
                this.timeoutId = setTimeout(() => {
                    logger.warn(`Reverting log level back info`);
                    transportStream.level = 'info';
                }, this.appConfig.log.timeout);
            } else {
                logger.warn('Log level will not be changed back automatically');
            }
        }
    }

    @ApiOperationPost({
        path: '/query-log',
        description: 'Use to change DB query level. Changes DB query to info',
        summary: 'By default db query logging is disabled.' +
            ' Use this operation to see actual SQL that is being executed ',
        parameters: {
        },
        responses: {
            200: {
                description: 'Successfully changed DB query',
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
        },
    })
    @httpPost('/query-log', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public enableQueryLogging(@response() res: express.Response, @principal() currentUser: User): void {
        logger.warn(`${currentUser.details.email} is enabling query logging. This slows down API calls`);
        this.sequlizeProvider.getSequelize().options.logging = logger.info.bind(logger);
    }

    @ApiOperationDelete({
        path: '/query-log',
        description: 'Use to disable DB query level',
        summary: '',
        parameters: {
        },
        responses: {
            200: {
                description: 'Successfully changed DB query',
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
        },
    })
    @httpDelete('/query-log', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public disableQueryLogging(@response() res: express.Response, @principal() currentUser: User): void {
        logger.info(`${currentUser.details.email} is disabling query logging`);
        this.sequlizeProvider.getSequelize().options.logging = false;
        res.sendStatus(HttpStatus.OK);
    }

    @ApiOperationDelete({
        path: '/cache/user',
        description: 'Clears internal in memory user cache',
        summary: 'Clears internal in memory user cache',
        parameters: {
        },
        responses: {
            200: {
                description: 'Successfully cleared user cache',
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
        },
    })
    @httpDelete('/cache/user', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public clearUserCache(@response() res: express.Response, @principal() currentUser: User): void {
        this.keycloakService.clearUserCache(currentUser);
        res.sendStatus(HttpStatus.OK);
    }

    @ApiOperationDelete({
        path: '/cache/form',
        description: 'Clears internal in memory form cache',
        summary: 'Clears internal in memory form cache',
        parameters: {
        },
        responses: {
            200: {
                description: 'Successfully cleared form cache',
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
        },
    })
    @httpDelete('/cache/form', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public clearFormCache(@principal() currentUser: User,
                          @response() res: express.Response): void {
        (this.lruCacheClient as LRUCacheClient).clearAll(currentUser);
        res.sendStatus(HttpStatus.OK);
    }

    @ApiOperationDelete({
        path: '/forms',
        description: 'Delete a form and associated comments/history. This will remove records from DB',
        summary: 'Delete a form and associated comments/history. This will remove records from DB',
        parameters: {
            path: {
               id: {
                   required: true,
               },
            },
        },
        responses: {
            200: {
                description: 'Successfully deleted form from system',
            },
            403: {
                description: 'Not allowed to perform this operation',
            },
            500: {description: 'Internal execution error'},
            404: {
                description: 'Form does not exist',
            },
        },
    })
    @httpDelete('/forms/:id', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public async hardDelete(@requestParam('id') id: string,
                            @response() res: express.Response,
                            @principal() currentUser: User): Promise<void> {

        await this.formService.purge(id, currentUser);
        res.sendStatus(HttpStatus.OK);
    }

    public clearTimeout(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }
}
