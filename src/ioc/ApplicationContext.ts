import {Container} from 'inversify';
import TYPE from "../constant/TYPE";
import {Form} from "../model/Form";
import {FormRepository} from "../constant/repository-types";
import {FormService} from "../service/FormService";


export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton'
        });
        this.container.bind<FormRepository>(TYPE.FormRepository).toConstantValue(Form);
        this.container.bind<FormService>(TYPE.FormService).to(FormService);
    }

    public iocContainer(): Container {
        return this.container;
    }
}
