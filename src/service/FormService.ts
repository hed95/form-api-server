import {Form} from "../model/Form";
import {inject, injectable} from "inversify";
import TYPE from "../constant/TYPE";
import {FormRepository} from "../constant/repository-types";

@injectable()
export class FormService {

    private readonly formRepository: FormRepository;

    constructor(@inject(TYPE.FormRepository) formRepository: FormRepository) {
        this.formRepository = formRepository;
    }

    public async create(jsonSchema: object): Promise<Form> {
        return null;
    }

    public getFormRepository() : FormRepository {
        return this.formRepository;
    }
}
