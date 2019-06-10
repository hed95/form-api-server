import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import {InversifyExpressServer} from 'inversify-express-utils';
import {ApplicationContext} from './container/ApplicationContext';
import './controller';
import logger from "./util/logger";
import TYPE from "./constant/TYPE";
import {SequelizeProvider} from "./model/SequelizeProvider";
import {KeycloakAuthProvider} from "./auth/KeycloakAuthProvider";
import {KeycloakService} from "./auth/KeycloakService";
import cors from 'cors';
import * as swagger from "swagger-express-ts";
import {SwaggerDefinitionConstant} from "swagger-express-ts";
import * as express from "express";


const port = process.env.PORT || 4000;
const applicationContext: ApplicationContext = new ApplicationContext();

const container = applicationContext.iocContainer();

const sequelizeProvider: SequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);

sequelizeProvider.getSequelize().sync({
    force: true
}).then(async () => {
    await sequelizeProvider.initDefaultRole(process.env.DEFAULT_ROLE);
    logger.info("DB initialised");
});

const version = "v1";
const basePath = `/api/${version}`;

const server = new InversifyExpressServer(container,
    null,
    {rootPath: basePath},
    null,
    KeycloakAuthProvider as any);



server.setConfig((app: any) => {
    const keycloakService: KeycloakService = container.get(TYPE.KeycloakService);
    app.use('/api-docs/swagger', express.static('swagger'));
    app.use('/api-docs/swagger/assets', express.static('node_modules/swagger-ui-dist'));
    app.use(swagger.express(
        {
            definition: {
                basePath: basePath,
                info: {
                    title: "Form API Service",
                    version: version
                },
                securityDefinitions: {
                    bearerAuth: {
                        type: SwaggerDefinitionConstant.Security.Type.API_KEY,
                        in: "header",
                        name: "Authorization",
                    }
                }
            }
        }
    ));
    app.use(keycloakService.middleware());
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(cors({
        optionsSuccessStatus: 200
    }));
    app.use(bodyParser.json());
});


const app = server.build();
app.listen(port);
logger.info("Server up and running on " + port);

exports = module.exports = app;
