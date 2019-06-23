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
    app.use(keycloakService.middleware());
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
        if (err instanceof ResourceNotFoundError) {
            const resourceNotFoundError = err as ResourceNotFoundError;
            res.status(404);
            res.json({
                message: resourceNotFoundError.message,
                type: 'RESOURCE_NOT_FOUND',
                requestedBy: user,
                path: req.path,
                method: req.method,
            });
        } else if (err instanceof ResourceValidationError) {
            const validationError = err as ResourceValidationError;
            res.status(400);
            res.json({
                validationErrors: validationError.get(),
                type: 'VALIDATION_FAILURE',
                requestedBy: user,
                path: req.path,
                method: req.method,
            });
        } else {
            res.status(500);
            res.json({
                exception: err.toString(),
                type: 'APPLICATION_ERROR',
                requestedBy: user,
                path: req.path,
                method: req.method,
            });
        }
    });
});

const expressApplication = server.build();
expressApplication.listen(port);
logger.info('Server up and running on ' + port);

exports = module.exports = expressApplication;
