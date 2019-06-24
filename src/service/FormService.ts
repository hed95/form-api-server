import {ValidationErrorItem, ValidationResult} from '@hapi/joi';
import {inject} from 'inversify';
import {provide} from 'inversify-binding-decorators';
import {FindAndCountOptions, Op, WhereOptions} from 'sequelize';
import {User} from '../auth/User';
import TYPE from '../constant/TYPE';
import InternalServerError from '../error/InternalServerError';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import ResourceValidationError from '../error/ResourceValidationError';
import {Form} from '../model/Form';
import {FormComment} from '../model/FormComment';
import {FormSchemaValidator} from '../model/FormSchemaValidator';
import {FormVersion} from '../model/FormVersion';
import {Role} from '../model/Role';
import {FormRepository, FormVersionRepository} from '../types/repository';
import logger from '../util/logger';
import _ from 'lodash';
import {Sequelize} from 'sequelize-typescript';
import {RoleService} from './RoleService';
import Validator from 'validator';

@provide(TYPE.FormService)
export class FormService {
    public readonly formRepository: FormRepository;
    public readonly formVersionRepository: FormVersionRepository;
    private readonly formSchemaValidator: FormSchemaValidator;
    private readonly roleService: RoleService;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository,
                @inject(TYPE.FormVersionRepository) formVersionRepository: FormVersionRepository,
                @inject(TYPE.FormSchemaValidator) formSchemaValidator: FormSchemaValidator,
                @inject(TYPE.RoleService) roleService: RoleService) {
        this.formRepository = formRepository;
        this.formVersionRepository = formVersionRepository;
        this.formSchemaValidator = formSchemaValidator;
        this.roleService = roleService;
    }

    public async create(user: User, payload: object): Promise<string> {
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(payload);
        if (validationResult.error) {
            logger.error('Failed validation on create', validationResult.error.details);
            return Promise.reject(new ResourceValidationError('Failed to validate form',
                validationResult.error.details));
        }
        // @ts-ignore
        const title: string = payload.title;
        // @ts-ignore
        const path: string = payload.path;
        // @ts-ignore
        const name: string = payload.name;
        // @ts-ignore
        const accessRoles: string[] = payload.access;

        return await this.formRepository.sequelize.transaction(async () => {
            const profiler = logger.startTimer();
            const loaded = await this.formVersionRepository.findOne({
                where: {
                    [Op.or]: [{
                        'schema.title': {
                            [Op.eq]: title,
                        },
                    }, {
                        'schema.name': {
                            [Op.eq]: name,
                        },
                    }, {
                        'schema.path': {
                            [Op.eq]: path,
                        },
                    }],
                },
            });

            if (loaded) {
                const validationErrors: ValidationErrorItem[] = [];
                // @ts-ignore
                if (loaded.schema.title === title) {
                    validationErrors.push(
                        {
                            message: `${title} already exists`,
                            path: ['title'],
                            type: 'duplicate',
                            context: {
                                key: 'title',
                                label: 'title',
                            },
                        },
                    );
                }
                // @ts-ignore
                if (loaded.schema.path === path) {
                    validationErrors.push(
                        {
                            message: `${path} already exists`,
                            path: ['path'],
                            type: 'duplicate',
                            context: {
                                key: 'path',
                                label: 'path',
                            },
                        },
                    );
                }
                // @ts-ignore
                if (loaded.schema.name === name) {
                    validationErrors.push(
                        {
                            message: `${name} already exists`,
                            path: ['name'],
                            type: 'duplicate',
                            context: {
                                key: 'name',
                                label: 'name',
                            },
                        },
                    );
                }
                throw new ResourceValidationError(`Form already exists`, validationErrors);
            }
            const defaultRole = await Role.defaultRole();

            const roles = await this.roleService.findByIds(accessRoles);
            const form = await this.formRepository.create({
                createdBy: user.details.email,
            });
            const rolesToApply: Role[] = roles.length === 0 ? [defaultRole] : roles;
            await form.$add('roles', rolesToApply);
            const today = new Date();
            await this.formVersionRepository.create({
                schema: payload,
                formId: form.id,
                validFrom: today,
                validTo: null,
                latest: true,
                createdBy: user.details.email,
            });

            profiler.done({message: 'Created form', user: user.details.email});
            return form.id;
        });
    }

    public async getAllForms(user: User,
                             limit: number = 20,
                             offset: number = 0,
                             filterQuery: object = null,
                             attributes: string[] = []):
        Promise<{ total: number, forms: FormVersion[] }> {

        const profiler = logger.startTimer();
        const defaultRole = await Role.defaultRole();

        const baseQueryOptions: WhereOptions = {
            latest: {
                [Op.eq]: true,
            },
            validTo: {
                [Op.eq]: null,
            },
        };
        if (filterQuery) {
            const keys: string[] = Object.keys(filterQuery);
            if (keys.length > 0) {
                _.forEach(keys, (key) => {
                    // @ts-ignore
                    baseQueryOptions[key] = filterQuery[key];
                });
            }
        }

        const query: FindAndCountOptions = {
            limit,
            offset,
            where: baseQueryOptions,
            include: [{
                model: Form,
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: [],
                    },
                    where: {
                        name: {
                            [Op.or]: {
                                [Op.in]: user.details.roles.map((role: Role) => {
                                    return role.name;
                                }),
                                [Op.eq]: defaultRole.name,
                            },
                        },
                    },
                }],
            }],
        };

        if (attributes.length !== 0) {
            // @ts-ignore
            query.attributes = _.map(attributes, (attribute) => {
                return [Sequelize.json(`schema.${attribute}`), attribute];
            });
        }

        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll(query);
        profiler.done({message: 'Completed getAllForms', user: user.details.email});
        return {
            total: result.count,
            forms: result.rows,
        };
    }

    public async restore(formId: string, formVersionId: string): Promise<FormVersion> {
        const profiler = logger.startTimer();
        return await this.formVersionRepository.sequelize.transaction(async (transaction) => {
            const date = new Date();
            const latestVersion = await this.formVersionRepository.findOne({
                where: {
                    formId: {
                        [Op.eq]: formId,
                    },
                    latest: {
                        [Op.eq]: true,
                    },
                    validTo: {
                        [Op.eq]: null,
                    },
                },
            });

            if (!latestVersion) {
                throw new ResourceNotFoundError(`Form ${formId} does not exist`);
            }
            const versionToRestore = await this.formVersionRepository.findOne({
                where: {
                    versionId: {
                        [Op.eq]: formVersionId,
                    },
                },
            });
            if (!versionToRestore) {
                throw new ResourceNotFoundError(`Version ${formVersionId} does not exist`);
            }

            await latestVersion.update({
                validTo: date,
                latest: false,
            });

            await versionToRestore.update({
                latest: true,
                validFrom: date,
                validTo: null,
            });
            profiler.done({message: `restored form id ${formId} to version ${versionToRestore.id}`});
            return versionToRestore;
        });
    }

    public async findForm(formId: string, user: User): Promise<FormVersion> {
        const isUUID: boolean = Validator.isUUID(formId);
        if (!isUUID) {
            throw new ResourceValidationError('Validation failure', [
                {
                    message: `${formId} not valid UUID`,
                    path: ['id'],
                    type: 'invalid',
                    context: {
                        key: 'id',
                        label: 'id',
                    },
                },
            ]);
        }

        const profiler = logger.startTimer();
        try {
            const defaultRole = await Role.defaultRole();

            return await this.formVersionRepository.findOne({
                limit: 1,
                offset: 0,
                where: {
                    formId: {
                        [Op.eq]: formId,
                    },
                    latest: {
                        [Op.eq]: true,
                    },
                    validTo: {
                        [Op.eq]: null,
                    },
                },
                include: [{
                    model: Form,
                    attributes: ['id'],
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['id', 'name'],
                        through: {
                            attributes: [],
                        },
                        where: {
                            name: {
                                [Op.or]: {
                                    [Op.in]: user.details.roles.map((role: Role) => {
                                        return role.name;
                                    }),
                                    [Op.eq]: defaultRole.name,
                                },
                            },
                        },
                    }],
                }],
            });
        } finally {
            profiler.done({message: `completed getting form for ${formId}`, user: user.details.email});
        }
    }

    public async findAllVersions(formId: string, offset: number, limit: number, user: User): Promise<{
        offset: number,
        limit: number,
        versions: FormVersion[],
        total: number,
    }> {
        const profiler = logger.startTimer();
        const form = await this.getForm(formId, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${formId} does not exist`);
        }

        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll({
            where: {
                formId: {
                    [Op.eq]: formId,
                },
            },
            order: [['validFrom', 'ASC']],
            offset,
            limit,
        });
        try {
            return Promise.resolve(
                {
                    offset,
                    limit,
                    versions: result.rows,
                    total: result.count,
                },
            );
        } finally {
            profiler.done({message: 'completed get all versions operation', user: user.details.email});
        }

    }

    public async update(id: string, form: object, currentUser: User) {
        const oldVersion = await this.formVersionRepository.findOne({
            where: {
                formId: {
                    [Op.eq]: id,
                },
            },
            include: [{
                model: Form,
            }],
        });
        if (!oldVersion) {
            throw new ResourceNotFoundError(`Form with ${id} does not exist for update`);
        }
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(form);
        if (validationResult.error) {
            logger.error('Failed to update from', validationResult.error.details);
            return Promise.reject(new ResourceValidationError('Failed to validate form',
                validationResult.error.details));
        }

        const currentDate = new Date();
        return this.formVersionRepository.sequelize.transaction(async () => {
            const userId = currentUser.details.email;
            await oldVersion.update({
                validTo: currentDate,
                latest: false,
                updatedBy: userId,
            });
            logger.info('Updated previous version to be invalid');

            const newVersion = await new FormVersion({
                schema: form,
                formId: oldVersion.form.id,
                validFrom: currentDate,
                createdBy: userId,
                validaTo: null,
                latest: true,
            }).save({});
            logger.info(`New version created. New version id ${newVersion.id} for form id ${oldVersion.form.id}`);
            return newVersion;

        });
    }

    public async delete(id: string, user: User): Promise<boolean> {

        const defaultRole = await Role.defaultRole();

        const version = await this.formVersionRepository.findOne({
            limit: 1,
            offset: 0,
            where: {
                formId: {
                    [Op.eq]: id,
                },
                latest: {
                    [Op.eq]: true,
                },
                validTo: {
                    [Op.eq]: null,
                },
            },
            include: [{
                model: Form, include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: [],
                    },
                    where: {
                        name: {
                            [Op.or]: {
                                [Op.in]: user.details.roles.map((role: Role) => {
                                    return role.name;
                                }),
                                [Op.eq]: defaultRole.name,
                            },
                        },
                    },
                }],
            }],
        });

        if (!version) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
        }
        const today = new Date();
        try {
            await version.update({
                updatedBy: user.details.email,
                validTo: today,
                updatedAt: today,
                latest: false,
            });
        } catch (e) {
            throw new InternalServerError(e.toString());
        }
        return true;
    }

    public async createComment(id: string, user: User, comment: FormComment): Promise<FormComment> {
        return await this.formRepository.sequelize.transaction(async () => {
            const form = await this.getForm(id, user);
            if (!form) {
                throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
            }
            const today = new Date();
            if (!comment.createdOn) {
                comment.set('createdOn', today);
            }
            if (!comment.createdBy) {
                comment.set('createdBy', user.details.email);
            }
            const commentCreated = await comment.save({});
            await form.$add('comments', [commentCreated]);
            return commentCreated;
        });
    }

    public async getComments(id: string, user: User): Promise<FormComment[]> {
        const form = await this.getForm(id, user, true);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
        }
        return form.comments;
    }

    public async updateRoles(formId: string, roles: Role[], user: User): Promise<void> {
        const form: Form = await this.getForm(formId, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${formId} does not exist`);
        }
        await form.$set('roles', roles);
        logger.info(`Role updated`, {
            formId,
        });
    }

    private async getForm(formId: string, user: User, includeComments: boolean = false) {
        const defaultRole = await Role.defaultRole();

        const query: object = {
            where: {
                id: {
                    [Op.eq]: formId,
                },
            },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: [],
                    },
                    where: {
                        name: {
                            [Op.or]: {
                                [Op.in]: user.details.roles.map((role: Role) => {
                                    return role.name;
                                }),
                                [Op.eq]: defaultRole.name,
                            },
                        },
                    },
                }],

        };
        if (includeComments) {
            // @ts-ignore
            query.include.push({
                model: FormComment,
                as: 'comments',
                attributes: ['id', 'createdBy', 'comment', 'createdOn'],
                through: {
                    attributes: [],
                },
            });
        }
        return await this.formRepository.findOne(query);
    }
}
