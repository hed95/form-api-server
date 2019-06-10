import {Container} from 'inversify';
import TYPE from "../constant/TYPE";
import {Form} from "../model/Form";
import {FormService} from "../service/FormService";
import {FormCommentRepository, FormRepository, FormVersionRepository, RoleRepository} from "../types/repository";
import logger from "../util/logger";
import {FormVersion} from "../model/FormVersion";
import {Role} from "../model/Role";
import {SequelizeProvider} from "../model/SequelizeProvider";
import {FormSchemaValidator} from "../model/FormSchemaValidator";
import {KeycloakService} from "../auth/KeycloakService";
import {ProtectMiddleware} from "../middleware/ProtectMiddleware";
import {FormComment} from "../model/FormComment";

export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton'

        });
        this.container.bind<KeycloakService>(TYPE.KeycloakService).to(KeycloakService);
        this.container.bind<ProtectMiddleware>(TYPE.ProtectMiddleware).to(ProtectMiddleware);
        this.container.bind<FormSchemaValidator>(TYPE.FormSchemaValidator).to(FormSchemaValidator);
        this.container.bind<SequelizeProvider>(TYPE.SequelizeProvider).to(SequelizeProvider);
        this.container.bind<FormRepository>(TYPE.FormRepository).toConstantValue(Form);
        this.container.bind<FormVersionRepository>(TYPE.FormVersionRepository).toConstantValue(FormVersion);
        this.container.bind<FormCommentRepository>(TYPE.FormCommentRepository).toConstantValue(FormComment);
        this.container.bind<RoleRepository>(TYPE.RoleRepository).toConstantValue(Role);
        this.container.bind<FormService>(TYPE.FormService).to(FormService);



        logger.info("Application context initialised");
    }

    public get(serviceIdentifier: string | symbol): any {
        return this.container.get(serviceIdentifier);
    }

    public iocContainer(): Container {
        return this.container;
    }
}
