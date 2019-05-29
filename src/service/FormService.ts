import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {FormVersion} from "../model/FormVersion";
import {FormRepository, FormVersionRepository} from "../types/repository";
import logger from "../util/logger";
import {provide} from "inversify-binding-decorators";
import {Op} from "sequelize";

@provide(TYPE.FormService)
export class FormService {
    private readonly formRepository: FormRepository;
    private readonly formVersionRepository: FormVersionRepository;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository,
                @inject(TYPE.FormVersionRepository) formVersionRepository: FormVersionRepository) {
        this.formRepository = formRepository;
        this.formVersionRepository = formVersionRepository;
    }

    public async create(jsonSchema: object): Promise<String> {
        const profiler = logger.startTimer();
        return new Promise((resolve: any) => {
            setTimeout(() => {
                resolve("hello");
                profiler.done({"message": "Form created"})
            }, 400)
        });
    }


    public async findForm(formId: string): Promise<FormVersion> {
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
                }
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
        const result: { rows: FormVersion[], count: number } = await FormVersion.findAndCountAll({
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

    public getFormRepository(): FormRepository {
        return this.formRepository;
    }
}
