import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as express from 'express';
import {InversifyExpressServer} from 'inversify-express-utils';
import * as swagger from 'swagger-express-ts';
import {SwaggerDefinitionConstant} from 'swagger-express-ts';
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

const port = process.env.PORT || 3000;
const applicationContext: ApplicationContext = new ApplicationContext();

const container = applicationContext.iocContainer();

const sequelizeProvider: SequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);

sequelizeProvider.getSequelize().sync({}).then(async () => {
    await SequelizeProvider.initDefaultRole(process.env.DEFAULT_ROLE);
    logger.info('DB initialised');
});

const version = 'v1';
const basePath = `/api/${version}`;

const server = new InversifyExpressServer(container,
    null,
    {rootPath: basePath},
    null,
    KeycloakAuthProvider);

server.setConfig((app: express.Application) => {
    const keycloakService: KeycloakService = container.get(TYPE.KeycloakService);

    app.use('/api-docs/swagger', express.static('swagger'));
    app.use('/api-docs/swagger/assets', express.static('node_modules/swagger-ui-dist'));
    app.use(swagger.express(
        {
            definition: {
                basePath,
                info: {
                    title: 'Form API Service',
                    version,
                },
                securityDefinitions: {
                    bearerAuth: {
                        type: SwaggerDefinitionConstant.Security.Type.API_KEY,
                        in: 'header',
                        name: 'Authorization',
                    },
                },
            },
        },
    ));

    app.use(httpContext.middleware);
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        httpContext.ns.bindEmitter(req);
        httpContext.ns.bindEmitter(res);
        const requestId = req.headers['x-request-id'] || uuid.v4();
        httpContext.set('x-request-id', requestId);
        next();
    });
    app.use(keycloakService.middleware());

    app.use(morgan((tokens: TokenIndexer, req: express.Request, res: express.Response) => {
        morgan.token('user', (request: express.Request, response: express.Response) => {
            // @ts-ignore
            return request.kauth.grant ? request.kauth.grant.access_token.content.email : 'anonymous';
        });
        morgan.token('response-time-ms', (request: express.Request, response: express.Response) => {
            // @ts-ignore
            return `${tokens['response-time'](request, response)} ms`;
        });
        morgan.token('x-request-id', (request: express.Request, response: express.Response) => {
            return httpContext.get('x-request-id');
        });
        return JSON.stringify({
            'method': tokens.method(req, res),
            'url': tokens.url(req, res),
            'status': tokens.status(req, res),
            'responseTimeInMs': tokens['response-time-ms'](req, res),
            'user': tokens.user(req, res),
            'x-request-id': tokens['x-request-id'](req, res),
        });
    }, {
        stream: new LoggerStream(),
    }));
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(cors({
        optionsSuccessStatus: 200,
    }));
    app.use(bodyParser.json());

}).setErrorConfig((app: express.Application) => {
    app.use((err: Error,
             req: express.Request,
             res: express.Response,
             next: express.NextFunction) => {
        logger.error('An exception occurred', {
            exception: err,
        });
        // @ts-ignore
        const user: string = req.kauth.grant.access_token.content.email;
        const xRequestId = httpContext.get('x-request-id');
        if (err instanceof ResourceNotFoundError) {
            const resourceNotFoundError = err as ResourceNotFoundError;
            res.status(404);
            res.json({
                'message': resourceNotFoundError.message,
                'type': 'RESOURCE_NOT_FOUND',
                'requestedBy': user,
                'path': req.path,
                'method': req.method,
                'x-request-id': xRequestId,
            });
        } else if (err instanceof ResourceValidationError) {
            const validationError = err as ResourceValidationError;
            res.status(400);
            res.json({
                'validationErrors': validationError.get(),
                'type': 'VALIDATION_FAILURE',
                'requestedBy': user,
                'path': req.path,
                'method': req.method,
                'x-request-id': xRequestId,
            });
        } else {
            res.status(500);
            res.json({
                'exception': err.toString(),
                'type': 'APPLICATION_ERROR',
                'requestedBy': user,
                'path': req.path,
                'method': req.method,
                'x-request-id': xRequestId,
            });
        }
    });
});

const expressApplication = server.build();
expressApplication.listen(port);
logger.info('Server up and running on ' + port);

exports = module.exports = expressApplication;
