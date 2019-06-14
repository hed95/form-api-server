import * as cls from 'continuation-local-storage';
import {provide} from 'inversify-binding-decorators';
import {Op} from 'sequelize';
import {Sequelize} from 'sequelize-typescript';
import TYPE from '../constant/TYPE';
import logger from '../util/logger';
import {Form} from './Form';
import {FormComment} from './FormComment';
import {FormCommentary} from './FormCommentary';
import {FormRoles} from './FormRoles';
import {FormVersion} from './FormVersion';
import {Role} from './Role';

const namespace = cls.createNamespace('sequelize-transaction');
Sequelize.useCLS(namespace);

@provide(TYPE.SequelizeProvider)
export class SequelizeProvider {

    private readonly sequelize: Sequelize;

    constructor() {
        const config = require('../config/dbconfig')[process.env.NODE_ENV || 'test'];
        this.sequelize = new Sequelize(config);
        this.sequelize.addModels([FormRoles, Role, Form, FormVersion, FormCommentary, FormComment]);
    }

    public getSequelize(): Sequelize {
        return this.sequelize;
    }

    public async initDefaultRole(roleName: string = 'anonymous'): Promise<void> {
        const role = await Role.findOne({
            where: {
                name: {
                    [Op.eq] : roleName,
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
}
