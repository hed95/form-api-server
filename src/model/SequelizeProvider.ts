import * as cls from 'continuation-local-storage';
import {provide} from 'inversify-binding-decorators';
import {Op} from 'sequelize';
import {Sequelize} from 'sequelize-typescript';
import TYPE from '../constant/TYPE';
import logger from '../util/logger';
import {Form} from './Form';
import {FormComment} from './FormComment';
import {FormRoles} from './FormRoles';
import {FormVersion} from './FormVersion';
import {Role} from './Role';
import defaultDBConfig from '../config/defaultDBConfig';
import defaultAppConfig from '../config/defaultAppConfig';

const namespace = cls.createNamespace('sequelize-transaction');
(Sequelize as any).__proto__.useCLS(namespace);

@provide(TYPE.SequelizeProvider)
export class SequelizeProvider {

    public static async initDefaultRole(roleName: string = 'anonymous'): Promise<void> {
        const role = await Role.findOne({
            where: {
                name: {
                    [Op.eq]: roleName,
                },
            },
        });
        if (!role) {
            await new Role({
                name: roleName,
                description: 'Default role that allows anyone to see a form',
                active: true,
            }).save();
            logger.info(`Created default role ${roleName}`);
        } else {
            logger.info(`${roleName} already exists so not creating`);
        }

    }

    private readonly sequelize: Sequelize;

    constructor() {
        const env = process.env.NODE_ENV || 'test';
        // @ts-ignore
        const config = defaultDBConfig[env];
        this.sequelize = new Sequelize(config);
        this.sequelize.options.logging = env === 'test' ? true :
            defaultAppConfig.query.log.enabled ? logger.debug.bind(logger) : false;
        this.sequelize.addModels([FormRoles, Role, Form, FormVersion, FormComment]);
    }

    public getSequelize(): Sequelize {
        return this.sequelize;
    }
}
