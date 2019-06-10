import {Sequelize} from "sequelize-typescript";
import {FormRoles} from "./FormRoles";
import {Role} from "./Role";
import {Form} from "./Form";
import {FormVersion} from "./FormVersion";
import {provide} from "inversify-binding-decorators";
import TYPE from "../constant/TYPE";
import logger from "../util/logger";
import * as cls from 'continuation-local-storage';
import {Op} from "sequelize";
import {FormCommentary} from "./FormCommentary";
import {FormComment} from "./FormComment";

const namespace = cls.createNamespace('sequelize-transaction');
Sequelize.useCLS(namespace);

@provide(TYPE.SequelizeProvider)
export class SequelizeProvider {

    private readonly sequelize: Sequelize;

    constructor() {
        const config = require('../config/config')["db"][process.env.NODE_ENV || 'test'];
        logger.info(`use config.use_env_variable ${config.use_env_variable}`);
        if (config.use_env_variable) {
            this.sequelize = new Sequelize(process.env[config.use_env_variable], config);
        } else {
            this.sequelize = new Sequelize(config.database, config.username, config.password, config);
        }
        this.sequelize.addModels([FormRoles, Role, Form, FormVersion, FormCommentary, FormComment]);
    }

    public getSequelize(): Sequelize {
        return this.sequelize;
    }

    public async initDefaultRole(roleName: string = "anonymous"): Promise<void> {
        const role = await Role.findOne({
            where: {
                name: {
                    [Op.eq] : roleName
                }
            }
        });
        if (!role) {
            await new Role({
                name: roleName,
                description: "Default role that allows anyone to see a form",
                active: true
            }).save();
            logger.info(`Created default role ${roleName}`);
        } else {
            logger.info(`${roleName} already exists so not creating`);
        }

    }
}
