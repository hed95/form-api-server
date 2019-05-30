import {Sequelize} from "sequelize-typescript";
import {FormRoles} from "./FormRoles";
import {Role} from "./Role";
import {Form} from "./Form";
import {FormVersion} from "./FormVersion";
import {provide} from "inversify-binding-decorators";
import TYPE from "../constant/TYPE";
import logger from "../util/logger";
import * as cls from 'continuation-local-storage';
const namespace = cls.createNamespace('sequelize-transaction');
Sequelize.useCLS(namespace);

@provide(TYPE.SequelizeProvider)
export class SequelizeProvider {

    private readonly sequelize: Sequelize;

    constructor() {
        const config = require('../config/config')[process.env.NODE_ENV || 'test'];
        logger.info(`use config.use_env_variable ${config.use_env_variable}`);
        if (config.use_env_variable) {
            this.sequelize = new Sequelize(process.env[config.use_env_variable], config);
        } else {
            this.sequelize = new Sequelize(config.database, config.username, config.password, config);
        }
        this.sequelize.addModels([FormRoles, Role, Form, FormVersion]);
        // this.sequelize.sync({}).then(() => {
        //    logger.info("DB initialised")
        // });
    }

    public getSequelize(): Sequelize {
        return this.sequelize;
    }
}
