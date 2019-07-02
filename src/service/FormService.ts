import {ValidationErrorItem, ValidationResult} from '@hapi/joi';
import {inject} from 'inversify';
import {provide} from 'inversify-binding-decorators';
import {FindAndCountOptions, Op, OptimisticLockError, WhereOptions} from 'sequelize';
import {User} from '../auth/User';
import TYPE from '../constant/TYPE';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import ResourceValidationError from '../error/ResourceValidationError';
import {Form} from '../model/Form';
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

    private static roleWhereClause(user: User, defaultRole: Role): WhereOptions {
        return {
            name: {
                [Op.or]: {
                    [Op.in]: user.details.roles.map((role: Role) => {
                        return role.name;
                    }),
                    [Op.eq]: defaultRole.name,
                },
            },
        };
    }

    private static handleDuplicateForm(loaded: FormVersion, title: string, path: string, name: string): void {
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

    public readonly formRepository: FormRepository;
    public readonly formVersionRepository: FormVersionRepository;
    private readonly roleAttributes: string[] = ['id', 'name', 'description'];
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

    public async create(user: User, payload: any): Promise<string> {
        payload = this.sanitize(payload);
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(payload);
        if (validationResult.error) {
            logger.error('Failed validation on create', validationResult.error.details);
            return Promise.reject(new ResourceValidationError('Failed to validate form',
                validationResult.error.details));
        }
        logger.info('Structure of the form looks ok...checking if this form already exists');
        const title: string = payload.title;
        const path: string = payload.path;
        const name: string = payload.name;
        const accessRoles: object[] = payload.access;

        return await this.formRepository.sequelize.transaction(async () => {
            const profiler = logger.startTimer();
            const loaded: FormVersion = await this.formVersionRepository.findOne({
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
                FormService.handleDuplicateForm(loaded, title, path, name);
            }
            const defaultRole = await Role.defaultRole();
            const today = new Date();

            const roles = await this.roleService.findOrCreate(accessRoles);
            const form = await this.formRepository.create({
                createdBy: user.details.email,
                createdOn: today,
                updatedOn: today,
                updatedBy: user.details.email,
            });
            const rolesToApply: Role[] = roles.length === 0 ? [defaultRole] : roles;
            await form.$add('roles', rolesToApply);

            payload.id = form.id;

            await this.formVersionRepository.create({
                schema: payload,
                formId: form.id,
                validFrom: today,
                validTo: null,
                latest: true,
                createdOn: today,
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
                             attributes: string[] = [],
                             countOnly: boolean = false):
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
            distinct: true,
            col: 'formId',
            include: [{
                required: true,
                model: Form,
                include: [{
                    required: true,
                    model: Role,
                    as: 'roles',
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                    where: FormService.roleWhereClause(user, defaultRole),
                }],
            }],
        };

        if (attributes.length !== 0) {
            // @ts-ignore
            query.attributes = _.map(attributes, (attribute) => {
                return [Sequelize.json(`schema.${attribute}`), attribute];
            });
        }

        let result: { rows: FormVersion[], count: number };
        if (countOnly) {
            const count: number = await this.formVersionRepository.count(query);
            result = {
                rows: [],
                count,
            };
        } else {
            result = await this.formVersionRepository.findAndCountAll(query);
        }

        profiler.done({message: 'Completed getAllForms', user: user.details.email});
        return {
            total: result.count,
            forms: result.rows,
        };
    }

    public async restore(formId: string, formVersionId: string, currentUser: User): Promise<FormVersion> {
        const profiler = logger.startTimer();
        return await this.formVersionRepository.sequelize.transaction(async (transaction) => {
            const date = new Date();
            const latestVersion = await this.formVersionRepository.findOne({
                where: this.latestFormClause(formId),
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

            const userId = currentUser.details.email;
            await latestVersion.update({
                validTo: date,
                latest: false,
                updatedBy: userId,
            });

            await versionToRestore.update({
                latest: true,
                validFrom: date,
                validTo: null,
                updatedBy: userId,
            });
            const reloaded = await this.findForm(formId, currentUser);
            profiler.done({message: `restored form id ${formId} to version ${versionToRestore.id}`});
            return reloaded;
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
                where: this.latestFormClause(formId),
                include: [{
                    model: Form,
                    attributes: ['id', 'createdOn', 'updatedOn'],
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: this.roleAttributes,
                        through: {
                            attributes: [],
                        },
                        where: FormService.roleWhereClause(user, defaultRole),
                    }],
                }],
            });
        } finally {
            profiler.done({message: `completed getting form for ${formId}`, user: user.details.email});
        }
    }

    public async findAllVersions(formId: string, user: User, offset: number = 0, limit: number = 20): Promise<{
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
            include: [{
                model: Form,
                required: true,
                include: [{
                    required: true,
                    model: Role,
                    as: 'roles',
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                }],
            }],
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

    public async update(id: string, form: any, currentUser: User) {

        form = this.sanitize(form);

        const latestVersion = await this.findForm(id, currentUser);

        if (!latestVersion) {
            throw new ResourceNotFoundError(`FormVersion with ${id} does not exist for update`);
        }
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(form);
        if (validationResult.error) {
            logger.error('Failed to update from', validationResult.error.details);
            throw new ResourceValidationError('Failed to validate form',
                validationResult.error.details);
        }
        return this.formVersionRepository.sequelize.transaction(async () => {
            const currentDate = new Date();
            const userId = currentUser.details.email;
            const formId = latestVersion.form.id;
            const formReloaded: Form = await this.formRepository.findByPk(formId);

            if (formReloaded.updatedOn.getTime() !== latestVersion.form.updatedOn.getTime()) {
                throw new OptimisticLockError({
                    message: `Form with ${formId} has already been updated`,
                    modelName: 'Form',
                });
            }
            await formReloaded.update({
                updatedOn: currentDate,
                updatedBy: userId,
            });
            await latestVersion.update({
                validTo: currentDate,
                latest: false,
                updatedBy: userId,
            });
            form.id = formId;
            form = this.sanitize(form);
            const newVersion = await new FormVersion({
                schema: form,
                formId,
                validFrom: currentDate,
                validTo: null,
                latest: true,
                createdOn: currentDate,
                createdBy: userId,
            }).save({});
            logger.info(`New version created. New version id ${newVersion.versionId} `
                + `for form id ${formReloaded.id}`);
            return newVersion;

        });
    }

    public async delete(id: string, user: User): Promise<boolean> {
        const defaultRole = await Role.defaultRole();
        const version = await this.formVersionRepository.findOne({
            limit: 1,
            offset: 0,
            where: this.latestFormClause(id),
            include: [{
                model: Form, include: [{
                    model: Role,
                    as: 'roles',
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                    where: FormService.roleWhereClause(user, defaultRole),
                }],
            }],
        });

        if (!version) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
        }
        const formFromOldVersion = version.form;
        await this.formVersionRepository.sequelize.transaction(async () => {
            const today = new Date();
            const reloaded: Form = await this.formRepository.findByPk(formFromOldVersion.id);
            if (reloaded.updatedOn.getTime() !== formFromOldVersion.updatedOn.getTime()) {
                throw new OptimisticLockError({
                    modelName: 'Form',
                    message: `Form with ${id} has been updated while trying to delete`,
                });
            }
            const userId = user.details.email;
            await formFromOldVersion.update({
                updatedOn: today,
                updatedBy: userId,
            });
            return await version.update({
                updatedBy: userId,
                validTo: today,
                latest: false,
            });
        });
        return true;
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

    public async findByVersionId(id: string, user: User): Promise<FormVersion> {
        const defaultRole = await Role.defaultRole();
        const version = await this.formVersionRepository.findByPk(id, {
            include: [{
                model: Form, include: [{
                    model: Role,
                    as: 'roles',
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                    where: FormService.roleWhereClause(user, defaultRole),
                }],
            }],
        });
        if (!version) {
            throw new ResourceNotFoundError(`Version with id ${id} does not exist`);
        }
        return version;
    }

    public async allForms(limit: number = 20, offset: number = 0): Promise<{ total: number, versions: FormVersion[] }> {

        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll({
            limit,
            offset,
            include: [{
                model: Form, include: [{
                    model: Role,
                    as: 'roles',
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                }],
            }],
        });
        return {
            total: result.count,
            versions: result.rows,
        };
    }

    public async getForm(formId: string, user: User) {
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
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                    where: FormService.roleWhereClause(user, defaultRole),
                }],

        };
        return await this.formRepository.findOne(query);
    }

    public async purge(id: string, user: User): Promise<boolean> {
        const formVersion: FormVersion = await this.findForm(id, user);
        if (!formVersion) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
        }
        logger.warn(`Form with id ${id} is being purged by ${user.details.email}`);
        const form: Form = formVersion.form;
        await this.formRepository.sequelize.transaction(async () => {

            await this.formRepository.sequelize.model('FormRoles').destroy({
                where: {
                    formId: {
                        [Op.eq]: form.id,
                    },
                },
            });

            await this.formRepository.sequelize.model('FormComment').destroy({
                where: {
                    formId: {
                        [Op.eq]: form.id,
                    },
                },
            });

            await this.formVersionRepository.destroy({
                where: {
                    formId: {
                        [Op.eq]: form.id,
                    },
                },
            });

            await this.formRepository.destroy({
                where: {
                    id: {
                        [Op.eq]: form.id,
                    },
                },
            });
            logger.info(`Form with id ${id} purged by ${user.details.email}`);
        });
        return true;
    }

    private latestFormClause(formId: string): WhereOptions {
        return {
            formId: {
                [Op.eq]: formId,
            },
            latest: {
                [Op.eq]: true,
            },
            validTo: {
                [Op.eq]: null,
            },
        };
    }

    private sanitize(form: any): any {
        return _.omit(form, ['createdOn', 'updatedOn', 'createdBy', 'updatedBy', 'versionId', 'links', 'machineName']);
    }

}
