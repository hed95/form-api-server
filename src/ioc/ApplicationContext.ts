import {Container} from 'inversify';
import TYPE from "../constant/TYPE";
import {Form} from "../model/Form";
import {FormService} from "../service/FormService";
import {FormRepository, FormVersionRepository, RoleRepository} from "../types/repository";
import logger from "../util/logger";
import {FormVersion} from "../model/FormVersion";
import {Role} from "../model/Role";

export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton'
        });
        this.container.bind<FormRepository>(TYPE.FormRepository).toConstantValue(Form);
        this.container.bind<FormVersionRepository>(TYPE.FormVersionRepository).toConstantValue(FormVersion);
        this.container.bind<RoleRepository>(TYPE.RoleRepository).toConstantValue(Role);
        this.container.bind<FormService>(TYPE.FormService).to(FormService);
        logger.info("Application context initialised");
    }

    public get(serviceIdentifier: string | symbol) : any {
        return this.container.get(serviceIdentifier);
    }
    public iocContainer(): Container {
        return this.container;
    }
}
