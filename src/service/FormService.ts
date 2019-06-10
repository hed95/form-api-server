import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {FormVersion} from "../model/FormVersion";
import {FormCommentRepository, FormRepository, FormVersionRepository, RoleRepository} from "../types/repository";
import logger from "../util/logger";
import {provide} from "inversify-binding-decorators";
import {Op} from "sequelize";
import {Form} from "../model/Form";
import {Role} from "../model/Role";
import {User} from "../auth/User";
import ResourceNotFoundError from "../error/ResourceNotFoundError";
import {FormSchemaValidator} from "../model/FormSchemaValidator";
import {ValidationResult} from "@hapi/joi";
import ValidationError from "../error/ValidationError";
import InternalServerError from "../error/InternalServerError";
import {FormComment} from "../model/FormComment";


@provide(TYPE.FormService)
export class FormService {
    readonly formRepository: FormRepository;
    readonly formVersionRepository: FormVersionRepository;
    private readonly formSchemaValidator: FormSchemaValidator;
    private readonly roleRepository: RoleRepository;
    private readonly formCommentRepository: FormCommentRepository;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository,
                @inject(TYPE.FormVersionRepository) formVersionRepository: FormVersionRepository,
                @inject(TYPE.FormSchemaValidator) formSchemaValidator: FormSchemaValidator,
                @inject(TYPE.RoleRepository) roleRepository: RoleRepository,
                @inject(TYPE.FormCommentRepository) formCommentRepository: FormCommentRepository) {
        this.formRepository = formRepository;
        this.formVersionRepository = formVersionRepository;
        this.formSchemaValidator = formSchemaValidator;
        this.roleRepository = roleRepository;
        this.formCommentRepository = formCommentRepository
    }

    public async create(user: User, payload: any): Promise<FormVersion> {
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(payload);
        if (validationResult.error) {
            logger.error("Failed validation on create", validationResult.error.details);
            return Promise.reject(new ValidationError("Failed to validate form", validationResult.error.details));
        }

        const title: string = payload.title;
        const path: string = payload.path;
        const name: string = payload.name;
        const accessRoles: string[] = payload.access;

        return await this.formRepository.sequelize.transaction(async () => {
            const defaultRole = await Role.defaultRole();

            const roles = accessRoles.length >= 1 ? await this.roleRepository.findAll({
                where: {
                    id: {
                        [Op.in]: accessRoles
                    }
                }
            }) : [];
            const form = await this.formRepository.create({
                createdBy: user.details.email,
            });
            const rolesToApply: Role[] = roles.length === 0 ? [defaultRole] : roles;
            await form.$add("roles", rolesToApply);
            payload["_id"] = form.id;

            const today = new Date();
            const formVersion = await this.formVersionRepository.create({
                title: title,
                path: path,
                name: name,
                schema: payload,
                formId: form.id,
                validFrom: today,
                validTo: null,
                latest: true,
                updatedBy: user.details.email
            });

            return await this.formVersionRepository.findByPk(formVersion.id, {
                include: [{
                    model: Form, include: [{
                        model: Role
                    }]
                }]
            })

        });
    }

    public async getAllForms(user: User, limit: number = 20, offset: number = 0): Promise<{ total: number, forms: FormVersion[] }> {
        const defaultRole = await Role.defaultRole();
        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository
            .findAndCountAll({
                limit: limit,
                offset: offset,
                where: {
                    latest: {
                        [Op.eq]: true
                    },
                    validTo: {
                        [Op.eq]: null
                    }
                },
                include: [{
                    model: Form, include: [{
                        model: Role,
                        as: "roles",
                        attributes: ["id", "name"],
                        through: {
                            attributes: []
                        },
                        where: {
                            name: {
                                [Op.or]: {
                                    [Op.in]: user.details.roles.map((role: Role) => {
                                        return role.name;
                                    }),
                                    [Op.eq]: defaultRole.name
                                }
                            }
                        }
                    }]
                }]
            });
        return {
            total: result.count,
            forms: result.rows
        };
    }

    public async restore(formId: string, formVersionId: string): Promise<FormVersion> {
        const profiler = logger.startTimer();
        return await this.formVersionRepository.sequelize.transaction(async (transaction) => {
            const date = new Date();
            const latestVersion = await this.formVersionRepository.findOne({
                where: {
                    formId: {
                        [Op.eq]: formId
                    },
                    latest: {
                        [Op.eq]: true
                    },
                    validTo: {
                        [Op.eq]: null
                    }
                }
            });

            if (!latestVersion) {
                throw new ResourceNotFoundError(`Form ${formId} does not exist`);
            }
            const versionToRestore = await this.formVersionRepository.findOne({
                where: {
                    id: {
                        [Op.eq]: formVersionId
                    }
                }
            });
            if (!versionToRestore) {
                throw new ResourceNotFoundError(`Version ${formVersionId} does not exist`);
            }

            await latestVersion.update({
                validTo: date,
                latest: false
            });

            await versionToRestore.update({
                latest: true,
                validFrom: date,
                validTo: null,
            });
            profiler.done({"message": `restored form id ${formId} to version ${versionToRestore.id}`});
            return versionToRestore;
        });
    }

    public async findForm(formId: string, user: User): Promise<FormVersion> {
        const profiler = logger.startTimer();
        try {
            const defaultRole = await Role.defaultRole();

            return await this.formVersionRepository.findOne({
                limit: 1,
                offset: 0,
                where: {
                    formId: {
                        [Op.eq]: formId
                    },
                    latest: {
                        [Op.eq]: true
                    },
                    validTo: {
                        [Op.eq]: null
                    }
                },
                include: [{
                    model: Form, include: [{
                        model: Role,
                        as: "roles",
                        attributes: ["id", "name"],
                        through: {
                            attributes: []
                        },
                        where: {
                            name: {
                                [Op.or]: {
                                    [Op.in]: user.details.roles.map((role: Role) => {
                                        return role.name;
                                    }),
                                    [Op.eq]: defaultRole.name
                                }
                            }
                        }
                    }]
                }]
            });
        } finally {
            profiler.done({"message": `completed getting form for ${formId}`})
        }
    }

    public async findAllVersions(formId: string, offset: number, limit: number, user: User): Promise<{
        offset: number,
        limit: number,
        versions: FormVersion[],
        total: number
    }> {
        const profiler = logger.startTimer();
        const form = await this.getForm(formId, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${formId} does not exist`);
        }

        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll({
            where: {
                formId: {
                    [Op.eq]: formId
                }
            },
            order: [['validFrom', 'ASC']],
            offset: offset,
            limit: limit,
        });
        try {
            return Promise.resolve(
                {
                    offset: offset,
                    limit: limit,
                    versions: result.rows,
                    total: result.count
                },
            );
        } finally {
            profiler.done({"message": "completed get all versions operation"})
        }

    }

    private async getForm(formId: string, user: User, includeComments: boolean = false) {
        const defaultRole = await Role.defaultRole();

        const query: any = {
            where: {
                id: {
                    [Op.eq]: formId
                }
            },
            include: [
                {
                    model: Role,
                    as: "roles",
                    attributes: ["id", "name"],
                    through: {
                        attributes: []
                    },
                    where: {
                        name: {
                            [Op.or]: {
                                [Op.in]: user.details.roles.map((role: Role) => {
                                    return role.name;
                                }),
                                [Op.eq]: defaultRole.name
                            }
                        }
                    }
                }]

        };
        if (includeComments) {
            query.include.push({
                model: FormComment,
                as: 'comments',
                attributes: ["id", "createdBy", "comment", "createdOn"],
                through: {
                    attributes: []
                }
            })
        }
        return await this.formRepository.findOne(query);
    }

    public async update(id: string, form: any, currentUser: User) {
        const oldVersion = await this.formVersionRepository.findOne({
            where: {
                formId: {
                    [Op.eq]: id
                }
            },
            include: [{
                model: Form
            }]
        });
        if (!oldVersion) {
            throw new ResourceNotFoundError(`Form with ${id} does not exist for update`);
        }
        const validationResult: ValidationResult<object> = this.formSchemaValidator.validate(form);
        if (validationResult.error) {
            logger.error("Failed to update from", validationResult.error.details);
            return Promise.reject(new ValidationError("Failed to validate form", validationResult.error.details));
        }

        const currentDate = new Date();
        return this.formVersionRepository.sequelize.transaction(async (t: any) => {
            await oldVersion.update({
                validTo: currentDate,
                latest: false,
                updateBy: currentUser.details.email
            });
            logger.info("Updated previous version to be invalid");
            const newVersion = await new FormVersion({
                title: form.title,
                name: form.name,
                path: form.path,
                schema: form,
                formId: oldVersion.form.id,
                validFrom: currentDate,
                updatedBy: currentUser.details.email,
                validaTo: null,
                latest: true
            }).save({});
            logger.info(`New version created. New version id ${newVersion.id} for form id ${oldVersion.form.id}`);
            return newVersion;

        });
    }

    async delete(id: string, user: User): Promise<boolean> {

        const defaultRole = await Role.defaultRole();

        const version = await this.formVersionRepository.findOne({
            limit: 1,
            offset: 0,
            where: {
                formId: {
                    [Op.eq]: id
                },
                latest: {
                    [Op.eq]: true
                },
                validTo: {
                    [Op.eq]: null
                }
            },
            include: [{
                model: Form, include: [{
                    model: Role,
                    as: "roles",
                    attributes: ["id", "name"],
                    through: {
                        attributes: []
                    },
                    where: {
                        name: {
                            [Op.or]: {
                                [Op.in]: user.details.roles.map((role: Role) => {
                                    return role.name;
                                }),
                                [Op.eq]: defaultRole.name
                            }
                        }
                    }
                }]
            }]
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
                latest: false
            });
        } catch (e) {
            throw new InternalServerError(e.toString());
        }
        return true;
    }

    async createComment(id: string, user: User, comment: string): Promise<FormComment> {
        return await this.formRepository.sequelize.transaction(async (t: any) => {
            const form = await this.getForm(id, user);
            if (!form) {
                throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
            }
            const today = new Date();
            const commentCreated = await this.formCommentRepository.create({
                createdOn: today,
                createdBy: user.details.email,
                comment: comment
            });
            await form.$add("comments", [commentCreated]);
            return commentCreated;
        });
    }

    async getComments(id: string, user: User): Promise<FormComment[]> {
        const form = await this.getForm(id, user, true);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
        }
        return form.comments;
    }
}
