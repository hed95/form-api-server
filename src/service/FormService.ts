import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {FormVersion} from "../model/FormVersion";
import {FormRepository, FormVersionRepository, RoleRepository} from "../types/repository";
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


@provide(TYPE.FormService)
export class FormService {
    readonly formRepository: FormRepository;
    readonly formVersionRepository: FormVersionRepository;
    private readonly formSchemaValidator: FormSchemaValidator;
    private readonly roleRepository: RoleRepository;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository,
                @inject(TYPE.FormVersionRepository) formVersionRepository: FormVersionRepository,
                @inject(TYPE.FormSchemaValidator) formSchemaValidator: FormSchemaValidator,
                @inject(TYPE.RoleRepository) roleRepository: RoleRepository) {
        this.formRepository = formRepository;
        this.formVersionRepository = formVersionRepository;
        this.formSchemaValidator = formSchemaValidator;
        this.roleRepository = roleRepository;
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

            const formVersion = await this.formVersionRepository.create({
                title: title,
                path: path,
                name: name,
                schema: payload,
                formId: form.id,
                validFrom: new Date(),
                validTo: null,
                latest: true
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

    public async findAllVersions(formId: String, offset: number, limit: number): Promise<{
        offset: number,
        limit: number,
        data: FormVersion[],
        total: number
    }> {
        const profiler = logger.startTimer();
        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository.findAndCountAll({
            where: {
                formId: {
                    [Op.eq]: formId
                }
            },
            offset: offset,
            limit: limit,
        });
        try {
            return Promise.resolve(
                {
                    offset: offset,
                    limit: limit,
                    data: result.rows,
                    total: result.count
                },
            );
        } finally {
            profiler.done({"message": "completed get all versions operation"})
        }

    }

}
