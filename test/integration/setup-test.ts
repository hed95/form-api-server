import 'reflect-metadata';
import 'mocha';
import {ApplicationContext} from "../../src/container/ApplicationContext";
import TYPE from "../../src/constant/TYPE";
import {SequelizeProvider} from "../../src/model/SequelizeProvider";
import {cleanUpMetadata} from "inversify-express-utils";

export let sequelizeProvider: SequelizeProvider;
export const applicationContext: ApplicationContext = new ApplicationContext();

beforeEach(() => {
    cleanUpMetadata();
});

before(async () => {
    process.env.NODE_ENV = "test";
    sequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);
    await sequelizeProvider.getSequelize().sync({force: true});
    await sequelizeProvider.initDefaultRole();
});
