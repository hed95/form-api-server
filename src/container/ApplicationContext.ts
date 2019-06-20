import {Container} from 'inversify';
import {KeycloakService} from '../auth/KeycloakService';
import TYPE from '../constant/TYPE';
import {ProtectMiddleware} from '../middleware/ProtectMiddleware';
import {Form} from '../model/Form';
import {FormComment} from '../model/FormComment';
import {FormSchemaValidator} from '../model/FormSchemaValidator';
import {FormVersion} from '../model/FormVersion';
import {Role} from '../model/Role';
import {SequelizeProvider} from '../model/SequelizeProvider';
import {FormService} from '../service/FormService';
import {FormCommentRepository, FormRepository, FormVersionRepository, RoleRepository} from '../types/repository';
import logger from '../util/logger';
import {RoleService} from '../service/RoleService';

export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton',

        });
        this.container.bind<KeycloakService>(TYPE.KeycloakService).to(KeycloakService);
        this.container.bind<ProtectMiddleware>(TYPE.ProtectMiddleware).to(ProtectMiddleware);
        this.container.bind<FormSchemaValidator>(TYPE.FormSchemaValidator).to(FormSchemaValidator);
        this.container.bind<SequelizeProvider>(TYPE.SequelizeProvider).to(SequelizeProvider);
        this.container.bind<FormRepository>(TYPE.FormRepository).toConstantValue(Form);
        this.container.bind<FormVersionRepository>(TYPE.FormVersionRepository).toConstantValue(FormVersion);
        this.container.bind<FormCommentRepository>(TYPE.FormCommentRepository).toConstantValue(FormComment);
        this.container.bind<RoleRepository>(TYPE.RoleRepository).toConstantValue(Role);
        this.container.bind<RoleService>(TYPE.RoleService).to(RoleService);
        this.container.bind<FormService>(TYPE.FormService).to(FormService);

        logger.info('Application context initialised');
    }

    public get<T>(serviceIdentifier: string | symbol): T {
        return this.container.get(serviceIdentifier);
    }

    public iocContainer(): Container {
        return this.container;
    }
}
