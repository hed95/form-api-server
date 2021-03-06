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
import {FormRepository, FormRolesRepository, FormVersionRepository} from '../types/repository';
import logger from '../util/logger';
import _ from 'lodash';
import {Model, Sequelize} from 'sequelize-typescript';
import {RoleService} from './RoleService';
import Validator from 'validator';
import {Cacheable, CacheClear} from 'type-cacheable';
import AppConfig from '../interfaces/AppConfig';
import CacheManager from 'type-cacheable/dist/CacheManager';
import moment from 'moment';

@provide(TYPE.FormService)
export class FormService {

    public static setCacheKey = (args: any[]) => `form-${args[0]}`;

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

    private static latestFormClause(formId: string): WhereOptions {
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

    private static sanitize(form: any): any {
        if (form.access && Array.isArray(form.access)) {
            const finalAccessRoles: object[] = [];
            _.forEach(form.access, (access) => {
                _.forEach(access, (a) => {
                    if (typeof a.role === 'object' && a.role !== null) {
                        finalAccessRoles.push(a.role);
                    }
                });
            });
            form.access = finalAccessRoles;
        }
        return _.omit(form, [
            'createdOn',
            'updatedOn',
            'createdBy',
            'updatedBy',
            'versionId',
            'links',
            'machineName',
            'owner',
            '_id',
            'created',
            'modified',
            'submissionAccess',
        ]);
    }

    public readonly formRepository: FormRepository;
    public readonly formRolesRepository: FormRolesRepository;
    public readonly formVersionRepository: FormVersionRepository;
    private readonly roleAttributes: string[] = ['id', 'name', 'description', 'active'];
    private readonly formSchemaValidator: FormSchemaValidator;
    private readonly roleService: RoleService;
    private readonly cacheManager: CacheManager;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository,
                @inject(TYPE.FormVersionRepository) formVersionRepository: FormVersionRepository,
                @inject(TYPE.FormRolesRepository) formRolesRepository: FormRolesRepository,
                @inject(TYPE.FormSchemaValidator) formSchemaValidator: FormSchemaValidator,
                @inject(TYPE.RoleService) roleService: RoleService,
                @inject(TYPE.AppConfig) appConfig: AppConfig,
                @inject(TYPE.CacheManager) cacheManager: CacheManager) {
        this.formRepository = formRepository;
        this.formVersionRepository = formVersionRepository;
        this.formSchemaValidator = formSchemaValidator;
        this.roleService = roleService;
        this.cacheManager = cacheManager;
        this.formRolesRepository = formRolesRepository;
    }

    public async create(user: User, payload: any): Promise<string> {
        payload = FormService.sanitize(payload);
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(payload);
        if (validationResult.error) {
            logger.error('Failed validation on create', validationResult.error.details);
            throw new ResourceValidationError('Failed to validate form',
                validationResult.error.details);
        }
        logger.info('Structure of the form looks ok...checking if this form already exists');
        const title: string = payload.title;
        const path: string = payload.path;
        const name: string = payload.name;
        const accessRoles: object[] = payload.access;

        return this.formRepository.sequelize.transaction(async () => {
            const profiler = logger.startTimer();
            const loaded: FormVersion = await this.formVersionRepository.findOne({
                where: {
                    [Op.and]: {
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
                        validFrom: {
                            [Op.eq]: null,
                        },
                    },

                },
            });

            if (loaded) {
                FormService.handleDuplicateForm(loaded, title, path, name);
            }
            const defaultRole = await this.roleService.getDefaultRole();
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
                             filterQuery: object[] = null,
                             attributes: string[] = [],
                             countOnly: boolean = false,
                             filterOperator: string = 'or'):
        Promise<{ total: number, forms: FormVersion[] }> {

        const profiler = logger.startTimer();
        const defaultRole = await this.roleService.getDefaultRole();

        const baseQueryOptions: WhereOptions = {
            latest: {
                [Op.eq]: true,
            },
            validTo: {
                [Op.eq]: null,
            },
        };
        // @ts-ignore
        if (filterQuery && filterQuery.length > 0) {
            // @ts-ignore
            baseQueryOptions[Symbol.for(filterOperator)] = filterQuery;
        }

        const query: FindAndCountOptions = {
            limit,
            offset,
            where: baseQueryOptions,
            distinct: true,
            col: 'formid',
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
                if (attribute === '_id') {
                    attribute = 'id';
                }
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

    @CacheClear({cacheKey: FormService.setCacheKey})
    public async restore(formId: string, formVersionId: string, currentUser: User): Promise<FormVersion> {
        const profiler = logger.startTimer();
        return this.formVersionRepository.sequelize.transaction(async (transaction) => {
            const date = new Date();
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
            const latestVersion = await this.formVersionRepository.findOne({
                where: FormService.latestFormClause(formId),
            });
            if (latestVersion) {
                await latestVersion.update({
                    validTo: date,
                    latest: false,
                    updatedBy: userId,
                });
                logger.debug(`Latest version ${latestVersion.versionId} updated to not latest`);

            }
            await versionToRestore.update({
                latest: true,
                validFrom: date,
                validTo: null,
                updatedBy: userId,
            });
            logger.debug(`version ${versionToRestore.versionId} updated to  latest`);
            const reloaded = await this.findLatestForm(formId, currentUser);
            profiler.done({message: `restored form id ${formId} to version ${versionToRestore.id}`});
            return reloaded;
        });
    }

    @Cacheable({cacheKey: FormService.setCacheKey, ttlSeconds: 1800})
    public async findForm(formId: string, user: User): Promise<FormVersion> {
        return this.findLatestForm(formId, user);
    }

    public async findLatestForm(formId: string, user: User): Promise<FormVersion> {
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
            const defaultRole = await this.roleService.getDefaultRole();
            return await this.formVersionRepository.findOne({
                limit: 1,
                offset: 0,
                where: FormService.latestFormClause(formId),
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

    public async findAllVersions(formId: string, user: User,
                                 offset: number = 0, limit: number = 20,
                                 select?: string[]): Promise<{
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

        const query: FindAndCountOptions = {
            where: {
                formId: {
                    [Op.eq]: formId,
                },
            },
            order: [['validFrom', 'DESC']],
            offset,
            limit,
            include: [{
                model: Form,
                required: false,
                attributes: ['id'],
                include: [{
                    required: false,
                    model: Role,
                    as: 'roles',
                    attributes: this.roleAttributes,
                    through: {
                        attributes: [],
                    },
                }],
            }],
        };

        if (select) {
            query.attributes = _.union(select, ['validFrom', 'formId']);
        }

        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll(query);
        try {
            return {
                offset,
                limit,
                versions: result.rows,
                total: result.count,
            };
        } finally {
            profiler.done({message: 'completed get all versions operation', user: user.details.email});
        }

    }

    @CacheClear({cacheKey: FormService.setCacheKey})
    public async update(id: string, form: any, currentUser: User) {
        const profiler = logger.startTimer();
        try {
            form = FormService.sanitize(form);
            const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(form);
            if (validationResult.error) {
                logger.error('Failed to update from', validationResult.error.details);
                throw new ResourceValidationError('Failed to validate form',
                    validationResult.error.details);
            }
            const latestVersion = await this.findLatestForm(id, currentUser);
            if (!latestVersion) {
                throw new ResourceNotFoundError(`FormVersion with ${id} does not exist for update`);
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
                form.id = formId;
                form = FormService.sanitize(form);
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

                await formReloaded.update({
                    updatedOn: currentDate,
                    updatedBy: userId,
                });
                await latestVersion.update({
                    validTo: currentDate,
                    latest: false,
                    updatedBy: userId,
                });

                return newVersion;

            });
        } finally {
            profiler.done({message: 'updated form', user: currentUser.details.email, formId: id});
        }
    }

    @CacheClear({cacheKey: FormService.setCacheKey})
    public async delete(id: string, user: User): Promise<boolean> {
        const defaultRole = await this.roleService.getDefaultRole();
        const version = await this.formVersionRepository.findOne({
            limit: 1,
            offset: 0,
            where: FormService.latestFormClause(id),
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
            return version.update({
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
        const defaultRole = await this.roleService.getDefaultRole();
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

    public async getAllLatestFormVersions() {
        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll({
            where: {
                latest: {
                    [Op.eq]: true,
                },
                validTo: {
                    [Op.eq]: null,
                },
            },
        });
        return {
            forms: result.rows,
            total: result.count,
        };
    }

    public async updateAllForms(forms: any[], currentUser: User): Promise<void> {
        const today = moment().toISOString();
        const formReferences = await this.formRepository.findAll({
            where: {
                id: {
                    [Op.in]: forms.map((form) => {
                        return form.formId;
                    }),
                },
            },
        });
        if (formReferences.length === 0) {
            logger.info('Creating');
            const formVersions: FormVersion[]  = await this.createNewForms(forms, currentUser);
            logger.info(`${formVersions.length} new forms created`);
        } else {
            logger.info('Updating');
            const formsUpdated = await this.formRepository.bulkCreate(formReferences.map((f) => {
                const form: any = f.toJSON();
                form.updatedOn = today;
                form.updatedBy = currentUser.details.email;
                return form;
            }), {
                updateOnDuplicate: [
                    'updatedOn',
                    'updatedBy',
                ],
            });

            logger.info(`Form references updated ${formsUpdated.length}`);

            const versions = await this.formVersionRepository.findAll({
                attributes: {
                    include: ['validTo', 'versionId', 'latest', 'updatedBy'],
                },
                where: {
                    versionId: {

                        [Op.in]: forms.map((form) => {
                            return form.versionId;
                        }),

                    },
                },
            });

            const latestVersions =  _.filter(versions, (v) => {
                return v.latest && v.validTo === null;
            });

            const nonLatestVersions = _.filter(versions, (v) => {
                return !v.latest && v.validTo !== null;
            }).map((v) => v.versionId);

            if (nonLatestVersions.length !== 0) {
                logger.warn(`Detected non latest version ids from payload...these will be ignored`, nonLatestVersions);
            }

            logger.info(`Loaded ${latestVersions.length} latest versions`);

            const versionsAsJson = latestVersions.map((v) => {
                const version: any = v.toJSON();
                version.validTo = today;
                version.updatedBy = currentUser.details.email;
                version.latest  = false;
                return version;
            });

            if (versionsAsJson.length !== 0) {
                const versionsUpdated = await this.formVersionRepository.bulkCreate(versionsAsJson, {
                    updateOnDuplicate: [
                        'latest',
                        'updatedBy',
                        'validTo',
                    ],
                });
                logger.info(`Latest versions marked as non-latest ${versionsUpdated.length}`);

                const newFormsToCreate = _.intersectionWith(forms, versionsUpdated.map((v) => v.toJSON()),
                    (v1: any, v2: any) => {
                        return v1.versionId === v2.versionId;
                    });

                logger.info('Creating new versions');
                const newVersions = await this.formVersionRepository.bulkCreate(newFormsToCreate.map((form) => {
                    delete form.versionId;
                    form.validFrom = today;
                    form.createdOn = today;
                    form.updatedBy = null;
                    form.validTo  = null;
                    form.latest = true;
                    form.createdBy = currentUser.details.email;
                    return form;
                }), {});
                logger.info(`Created new ${newVersions.length} instances`);
            } else {
                logger.warn('No latest version forms found...please check version ids');
            }
        }
        return null;
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
        const defaultRole = await this.roleService.getDefaultRole();
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
        return this.formRepository.findOne(query);
    }

    @CacheClear({cacheKey: FormService.setCacheKey})
    public async purge(id: string, user: User): Promise<boolean> {
        const formVersion: FormVersion = await this.findLatestForm(id, user);
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

    public async findByFormAndVersion(formId: string, versionId: string, user: User): Promise<FormVersion> {
        const defaultRole = await this.roleService.getDefaultRole();
        const version = await this.formVersionRepository.findOne({
            where: {
                [Op.and]: [
                    {
                        formId: {
                            [Op.eq]: formId,
                        },
                    },
                    {
                        versionId: {
                            [Op.eq]: versionId,
                        },
                    },
                ],
            },
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
            throw new ResourceNotFoundError(`Version with id ${versionId} does not exist`);
        }
        return version;
    }

    private async createNewForms(forms: any[], currentUser: User): Promise<FormVersion[]> {

        const defaultRole = await this.roleService.getDefaultRole();
        const today = new Date();
        const createdBy = currentUser.details.email;

        const formsToCreate = forms.map(() => {
            return {
                createdBy,
                createdOn: today,
                updatedOn: today,
                updatedBy: createdBy,
            };
        });
        const formsCreated = await this.formRepository.bulkCreate(formsToCreate, {});
        logger.info(`${formsCreated.length} form references created`);

        const formRoles = formsCreated.map((form) => {
            return {
                formId: form.id,
                roleId: defaultRole.id,
            };
        });

        await this.formRolesRepository.bulkCreate(formRoles);
        logger.info('Performed role association');

        const formIds = formsCreated.map((form: Form) => {
            return form.id;
        });

        _.each(formIds, (formId: string, index: number) => {
           delete forms[index].versionId;
           forms[index].schema.id = formId;
           forms[index].formId = formId;
           forms[index].validFrom = today;
           forms[index].latest = true;
           forms[index].createdBy = createdBy;
           forms[index].createdOn = today;
        });

        const formVersions =  await this.formVersionRepository.bulkCreate(forms, {});
        logger.info(`Created ${formVersions.length} versions`);
        return formVersions;
    }

}
