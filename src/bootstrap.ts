import 'reflect-metadata';
import * as bodyParser from 'body-parser';
import {InversifyExpressServer} from 'inversify-express-utils';
import {ApplicationContext} from './ioc/ApplicationContext';
import './controller';

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
app.listen(4000);

exports = module.exports = app;
