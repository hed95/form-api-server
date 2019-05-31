import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import {InversifyExpressServer} from 'inversify-express-utils';
import {ApplicationContext} from './container/ApplicationContext';
import './controller';
import logger from "./util/logger";
import TYPE from "./constant/TYPE";
import {SequelizeProvider} from "./model/SequelizeProvider";

const port = process.env.PORT || 4000;
const applicationContext: ApplicationContext = new ApplicationContext();

const container = applicationContext.iocContainer();

const sequelizeProvider: SequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);

sequelizeProvider.getSequelize().sync({
    force: true
}).then(async() => {
    await sequelizeProvider.initDefaultRole(process.env.DEFAULT_ROLE);
    logger.info("DB initialised");
});

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(bodyParser.json
    ());
});

const app = server.build();
app.listen(port);
logger.info("Server up and running");

exports = module.exports = app;
