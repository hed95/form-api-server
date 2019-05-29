import {inject, injectable} from "inversify";
import TYPE from "../constant/TYPE";
import {FormVersion} from "../model/FormVersion";
import {FormRepository} from "../types/repository";
import logger from "../util/logger";

@injectable()
export class FormService {

    private readonly formRepository: FormRepository;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository) {
        this.formRepository = formRepository;
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

    public async findAllVersions(formId: String, page: number, limit: number): Promise<FormVersion[]> {
        return null;
    }

    public getFormRepository(): FormRepository {
        return this.formRepository;
    }
}
