import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {FormVersion} from "../model/FormVersion";
import {FormRepository, FormVersionRepository} from "../types/repository";
import logger from "../util/logger";
import {provide} from "inversify-binding-decorators";
import Sequelize, {Op} from "sequelize";
import {Form} from "../model/Form";
import {Role} from "../model/Role";
import {User} from "../model/User";
import ResourceNotFoundError from "../error/ResourceNotFoundError";

@provide(TYPE.FormService)
export class FormService {
    readonly formRepository: FormRepository;
    readonly formVersionRepository: FormVersionRepository;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository,
                @inject(TYPE.FormVersionRepository) formVersionRepository: FormVersionRepository) {
        this.formRepository = formRepository;
        this.formVersionRepository = formVersionRepository;
    }

    public async getAllForms(user: User, limit: number = 20, offset: number = 0): Promise<{ total: number, forms: FormVersion[] }> {

        const result: { rows: FormVersion[], count: number } = await this.formVersionRepository
            .findAndCountAll({
                limit: limit,
                offset: offset,
                where: {
                    latest: {
                        [Op.eq]: true
                    },
                    outDate: {
                        [Op.eq]: null
                    }
                },
                include: [{
                    model: Form,
                    required: true,
                    include: [{
                        model: Role,
                        required: true,
                        where: {
                            name: {
                                [Op.or]: {
                                    [Op.in] : user.roles.map((role: Role) => {
                                        return role.name;
                                    }),
                                    [Op.eq] : 'all'
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
                    outDate: {
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
                outDate: date,
                latest: false
            });

            await versionToRestore.update({
                latest: true,
                inDate: date,
                outDate: null,
            });
            profiler.done({"message": `restored form id ${formId} to version ${versionToRestore.id}`});
            return versionToRestore;
        });
    }

    public async findForm(formId: string, user: User): Promise<FormVersion> {
        const profiler = logger.startTimer();
        try {
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
                    outDate: {
                        [Op.eq]: null
                    }
                },
                include: [{
                    model: Form, include: [{
                        model: Role, where: {
                            name: {
                                [Op.or]: {
                                    [Op.in]:  user.roles.map((role: Role) => {
                                        return role.name;
                                    }),
                                    [Op.eq] : "all"
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
