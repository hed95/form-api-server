import 'reflect-metadata';
import 'mocha';
import {ApplicationContext} from "../../src/container/ApplicationContext";
import TYPE from "../../src/constant/TYPE";
import {SequelizeProvider} from "../../src/model/SequelizeProvider";
import {FormRoles} from "../../src/model/FormRoles";
import {Role} from "../../src/model/Role";
import {FormVersion} from "../../src/model/FormVersion";
import {Form} from "../../src/model/Form";

export let sequelizeProvider: SequelizeProvider;
export const applicationContext: ApplicationContext = new ApplicationContext();

before(async () => {
    sequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);
    await sequelizeProvider.getSequelize().sync({force: true});
});

after(async () => {
    await FormRoles.destroy({
        where: {},
        truncate: true
    });
    await Role.destroy({
        where: {},
        truncate: true
    });
    await FormVersion.destroy({
        where: {},
        truncate: true
    });
    await Form.destroy({
        where: {},
        truncate: true
    });
});
