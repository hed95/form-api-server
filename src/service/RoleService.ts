import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import {RoleRepository} from '../types/repository';
import {Role} from '../model/Role';
import _ from 'lodash';
import {Op} from 'sequelize';
import {User} from '../auth/User';
import logger from '../util/logger';
import * as Joi from '@hapi/joi';
import {ValidationResult} from '@hapi/joi';
import ResourceValidationError from '../error/ResourceValidationError';

@provide(TYPE.RoleService)
export class RoleService {

    constructor(@inject(TYPE.RoleRepository) private readonly roleRepository: RoleRepository) {
    }

    public async createRoles(roles: Array<{ name: string, description: string }>, user: User): Promise<Role[]> {

        const roleSchema = Joi.object().keys({
            name: Joi.string().required(),
            description: Joi.string(),
        });

        const validation: ValidationResult<object> = Joi.validate(roles, Joi.array().items(roleSchema), {
            abortEarly: false,
        });

        if (validation.error) {
            throw new ResourceValidationError('Roles not complete', validation.error.details);
        }

        const profiler = logger.startTimer();
        const result = await this.roleRepository.bulkCreate(_.map(roles, (role) => {
            return {
                name: role.name,
                description: role.description,
                active: true,
            };
        }), {
            returning: true,
        });
        profiler.done({
            message: `Created new roles`,
            roles,
            user: user.details.email,
        });
        return result;

    }

    public async findOrCreate(roles: object[]): Promise<Role[]> {
        if (!roles || roles.length === 0) {
            return Promise.resolve([]);
        }

        return await Promise.all(_.map(roles, async (role: any) => {
            const roleCreated: [Role, boolean] = await this.roleRepository.findOrCreate({
                where: {
                    name: role.name,
                },
            });
            return roleCreated[0];
        }));
    }

    public async findByIds(ids: string[]): Promise<Role[]> {
        if (!ids || ids.length === 0) {
            return Promise.resolve([]);
        }
        return await this.roleRepository.findAll({
            where: {
                id: {
                    [Op.in]: ids,
                },
            },
        });
    }

    public async roles(limit: number = 20, offset: number = 0): Promise<{ rows: Role[], count: number }> {
        return await this.roleRepository.findAndCountAll({
            limit,
            offset,
        });
    }

}
