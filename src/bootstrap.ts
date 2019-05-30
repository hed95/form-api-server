import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import {InversifyExpressServer} from 'inversify-express-utils';
import {ApplicationContext} from './container/ApplicationContext';
import './controller';
import logger from "./util/logger";
import TYPE from "./constant/TYPE";
import {SequelizeProvider} from "./model/SequelizeProvider";
import { getRouteInfo } from "inversify-express-utils";
import * as prettyjson from "prettyjson";

const port = process.env.PORT || 4000;
const applicationContext: ApplicationContext = new ApplicationContext();

const container = applicationContext.iocContainer();

const sequelizeProvider: SequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);

sequelizeProvider.getSequelize().sync({
    force: false
}).then(() => {
    logger.info("DB initialised");
});

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(bodyParser.json());
});

const app = server.build();
app.listen(port);
logger.info("Server up and running");
const routeInfo = getRouteInfo(container);
logger.info("routes", {routes: routeInfo});

exports = module.exports = app;
