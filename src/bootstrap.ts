import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {InversifyExpressServer} from 'inversify-express-utils';
import * as swagger from 'swagger-express-ts';
import {KeycloakAuthProvider} from './auth/KeycloakAuthProvider';
import {KeycloakService} from './auth/KeycloakService';
import TYPE from './constant/TYPE';
import {ApplicationContext} from './container/ApplicationContext';
import './controller';
import {SequelizeProvider} from './model/SequelizeProvider';
import logger from './util/logger';
import ResourceNotFoundError from './error/ResourceNotFoundError';
import ResourceValidationError from './error/ResourceValidationError';
import morgan, {TokenIndexer} from 'morgan';
import {LoggerStream} from './util/LoggerStream';
import httpContext from 'express-http-context';
import uuid from 'uuid';
import HttpStatus from 'http-status-codes';
import UnauthorizedError from './error/UnauthorizedError';
import AppConfig from './interfaces/AppConfig';
import {OptimisticLockError} from 'sequelize';
import {ApplicationConstants} from './constant/ApplicationConstants';
import {ConfigValidator} from './config/ConfigValidator';
import {EventEmitter} from 'events';
import DataContextPluginRegistry from './plugin/DataContextPluginRegistry';
import {GrantedRequest} from 'keycloak-connect';

const defaultPort: number = 3000;

const port = process.env.API_FORM_PORT || defaultPort;
const applicationContext: ApplicationContext = new ApplicationContext();

const container = applicationContext.iocContainer();

const eventEmitter: EventEmitter = container.get(TYPE.EventEmitter);

const sequelizeProvider: SequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);

SequelizeProvider.initDefaultRole(process.env.DEFAULT_ROLE).then(() => {
   logger.info('Default role initialised');
}, (error) => {
    logger.error(error);
});

const appConfig: AppConfig = container.get(TYPE.AppConfig);
const configValidator = new ConfigValidator();
const result = configValidator.validate(appConfig);
if (result.error) {
    logger.error('Config failed validation', result.error.details);
    process.exit(1);
}

if (appConfig.log.enabled) {
    if (!appConfig.log.timeout) {
        logger.error('No log revert timeout defined');
        process.exit(1);
    }
}

const version = 'v1';
const basePath = ``;

const expressApp: express.Application = express();

const corsOrigins = appConfig.cors.origin;
if (corsOrigins.length !== 0) {
    logger.info('CORS origin configured', {
        origins: corsOrigins,
    });
    expressApp.use(cors({
        origin: corsOrigins,
        optionsSuccessStatus: 200,
    }));
} else {
    logger.info('No CORS configured defaulting to *');

    const corsConfiguration = {
        origin: '*',
        methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    };
    expressApp.use(cors(corsConfiguration));
    expressApp.options('*', cors(corsConfiguration));
}
expressApp.use(httpContext.middleware);
const keycloakService: KeycloakService = container.get(TYPE.KeycloakService);

if (appConfig.dataContextPluginLocation) {
    try {
        // tslint:disable-next-line:no-var-requires
        const plugin = require(appConfig.dataContextPluginLocation);
        if (plugin) {
            logger.info('Data context plugin found');
            const pluginRegistry: DataContextPluginRegistry = container.get(TYPE.DataContextPluginRegistry);
            pluginRegistry.register(plugin);
        } else {
            logger.warn('A plugin was set up but could not be found. Please check configuration');
        }
    } catch (e) {
        logger.warn(e.message);
    }
}

expressApp.use('/api-docs/swagger', express.static('swagger'));
expressApp.use('/api-docs/swagger/assets', express.static('node_modules/swagger-ui-dist'));
expressApp.use(swagger.express(
    {
        definition: {
            schemes: ['http', 'https'],
            basePath,
            info: {
                title: 'Form API Service',
                version,
            },
            securityDefinitions: {
                bearerAuth: {
                    type: swagger.SwaggerDefinitionConstant.Security.Type.API_KEY,
                    in: 'header',
                    name: 'Authorization',
                },
            },
        },
    },
));

expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);
    const requestId = req.headers[appConfig.correlationIdRequestHeader] || uuid.v4();
    httpContext.set(appConfig.correlationIdRequestHeader, requestId);
    next();
});

expressApp.use(keycloakService.middleware());

expressApp.use(async (req: GrantedRequest, res: express.Response, next: express.NextFunction) => {
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);
    let userId;
    const userEmailFromHeader = req.get(ApplicationConstants.USER_ID);
    if (userEmailFromHeader) {
        const user = await keycloakService.getUser(userEmailFromHeader);
        if (user) {
            userId = user.details.email;
        } else {
            next(new UnauthorizedError(`User ${userEmailFromHeader} not authorized`));
        }
    } else {
        // @ts-ignore
        userId = req.kauth && req.kauth.grant ? req.kauth.grant.access_token.content.email :
            ApplicationConstants.ANONYMOUS;
    }
    httpContext.set(ApplicationConstants.USER_ID, userId);
    next();
});

expressApp.use(morgan((tokens: TokenIndexer, req: express.Request, res: express.Response) => {
    morgan.token('referrer', (request: express.Request, response: express.Response) => {
        return request.headers.referer;
    });
    morgan.token('response-time-ms', (request: express.Request, response: express.Response) => {
        return `${tokens['response-time'](request, response)} ms`;
    });
    morgan.token(appConfig.correlationIdRequestHeader,
        (request: express.Request, response: express.Response) => {
            return httpContext.get(appConfig.correlationIdRequestHeader);
        });
    return JSON.stringify({
        referrer: tokens.referrer(req, res),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        responseTimeInMs: tokens['response-time-ms'](req, res),
    });
}, {
    stream: new LoggerStream(),
}));

expressApp.use(bodyParser.json({
    limit: '50mb',
}));
expressApp.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 50000,
}));

const server = new InversifyExpressServer(container,
    null,
    {rootPath: basePath},
    expressApp,
    KeycloakAuthProvider);

server.setErrorConfig((app: express.Application) => {
    app.use((err: Error,
             req: express.Request,
             res: express.Response,
             next: express.NextFunction) => {
        if (err) {
            logger.error('An exception occurred', {
                exception: err.stack,
            });
        }
        const userEmailFromHeader = req.get(ApplicationConstants.USER_ID);
        // @ts-ignore
        const user: string = userEmailFromHeader ? userEmailFromHeader : req.kauth.grant.access_token.content.email;

        const correlationId = httpContext.get(appConfig.correlationIdRequestHeader);
        if (err instanceof ResourceNotFoundError) {
            const resourceNotFoundError = err as ResourceNotFoundError;
            res.status(HttpStatus.NOT_FOUND);
            res.json({
                message: resourceNotFoundError.message,
                type: 'RESOURCE_NOT_FOUND',
                requestedBy: user,
                path: req.path,
                method: req.method,
                [appConfig.correlationIdRequestHeader]: correlationId,
            });
        } else if (err instanceof ResourceValidationError) {
            const validationError = err as ResourceValidationError;
            res.status(HttpStatus.BAD_REQUEST);
            res.json({
                validationErrors: validationError.get(),
                type: 'VALIDATION_FAILURE',
                requestedBy: user,
                path: req.path,
                method: req.method,
                [appConfig.correlationIdRequestHeader]: correlationId,
            });
        } else if (err instanceof UnauthorizedError) {
            res.status(HttpStatus.UNAUTHORIZED);
            res.json({
                type: 'UNAUTHORIZED',
                requestedBy: user,
                path: req.path,
                method: req.method,
                [appConfig.correlationIdRequestHeader]: correlationId,
                message: 'You are not authorized to perform the operation',
                error: err.message,
            });

        } else if (err instanceof OptimisticLockError) {
            const error = err as OptimisticLockError;
            res.status(HttpStatus.CONFLICT);
            res.json({
                type: 'OPTIMISTIC_LOCK',
                requestedBy: user,
                path: req.path,
                method: req.method,
                [appConfig.correlationIdRequestHeader]: correlationId,
                message: error.message,
            });
        } else {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json({
                exception: err.toString(),
                type: 'APPLICATION_ERROR',
                requestedBy: user,
                path: req.path,
                method: req.method,
                [appConfig.correlationIdRequestHeader]: correlationId,
            });
        }
    });
});

const clearUp = async () => {
    eventEmitter.emit(ApplicationConstants.SHUTDOWN_EVENT);
    await sequelizeProvider.getSequelize().close();
    process.exit(1);
};

process.on('SIGTERM', async () => {
    clearUp().then(() => {
        logger.info('all cleaned and finished');
    });
});
process.on('SIGINT', async () => {
    clearUp().then(() => {
        logger.info('all cleaned and finished');
    });
});

process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
    logger.error('unhandledRejection', {
        exception: reason.message,
    });
});

process.on('uncaughtException', (error) => {
    logger.error('uncaughtException', error);
});

const expressApplication = server.build();

expressApplication.listen(port);
logger.info('Server up and running on ' + port);

exports = module.exports = expressApplication;
