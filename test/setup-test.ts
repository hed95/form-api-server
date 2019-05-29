import 'reflect-metadata';
import 'mocha';
import {Sequelize} from "sequelize-typescript";
import {Role} from "../src/model/Role";
import {FormRoles} from "../src/model/FormRoles";
import {Form} from "../src/model/Form";
import {FormVersion} from "../src/model/FormVersion";
const db = '__';


const sequelize = new Sequelize({
    database: db,
    dialect: 'sqlite',
    username: 'root',
    password: '',
    storage: ':memory:'
});
sequelize.addModels([FormRoles, Role, Form, FormVersion]);

before(async () => {
    await FormRoles.sync({force: true});
    await Role.sync({force: true});
    await Form.sync({force: true});
    await FormVersion.sync({force: true});
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
