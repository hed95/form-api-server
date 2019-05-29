import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import {InversifyExpressServer} from 'inversify-express-utils';
import {ApplicationContext} from './container/ApplicationContext';
import './controller';
import logger from "./util/logger";

const port = process.env.PORT || 4000;
const applicationContext: ApplicationContext = new ApplicationContext();

const container = applicationContext.iocContainer();

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

exports = module.exports = app;
