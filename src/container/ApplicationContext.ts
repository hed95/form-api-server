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
import {ValidationService} from '../service/ValidationService';
import {FormResourceAssembler} from '../controller/FormResourceAssembler';
import {AdminProtectMiddleware} from '../middleware/AdminProtectMiddleware';
import {CommentService} from '../service/CommentService';
import AppConfig from '../interfaces/AppConfig';
import defaultAppConfig from '../config/defaultAppConfig';
import {EventEmitter} from 'events';
import {LRUCacheClient} from '../service/LRUCacheClient';
import {ApplicationConstants} from '../util/ApplicationConstants';
import {PDFService} from '../service/PDFService';

export class ApplicationContext {
    private readonly container: Container;
    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton',

        });
        const eventEmitter = new EventEmitter();
        this.container.bind<EventEmitter>(TYPE.EventEmitter).toConstantValue(eventEmitter);
        this.container.bind<AppConfig>(TYPE.AppConfig).toConstantValue(defaultAppConfig);
        this.container.bind<LRUCacheClient>(TYPE.LRUCacheClient).to(LRUCacheClient);
        this.container.bind<KeycloakService>(TYPE.KeycloakService).to(KeycloakService);
        this.container.bind<ProtectMiddleware>(TYPE.ProtectMiddleware).to(ProtectMiddleware);
        this.container.bind<FormSchemaValidator>(TYPE.FormSchemaValidator).to(FormSchemaValidator);
        this.container.bind<SequelizeProvider>(TYPE.SequelizeProvider).to(SequelizeProvider);
        this.container.bind<FormRepository>(TYPE.FormRepository).toConstantValue(Form);
        this.container.bind<FormVersionRepository>(TYPE.FormVersionRepository).toConstantValue(FormVersion);
        this.container.bind<FormCommentRepository>(TYPE.FormCommentRepository).toConstantValue(FormComment);
        this.container.bind<RoleRepository>(TYPE.RoleRepository).toConstantValue(Role);
        this.container.bind<ValidationService>(TYPE.ValidationService).to(ValidationService);
        this.container.bind<RoleService>(TYPE.RoleService).to(RoleService);
        this.container.bind<FormService>(TYPE.FormService).to(FormService);
        this.container.bind<FormResourceAssembler>(TYPE.FormResourceAssembler).to(FormResourceAssembler);
        this.container.bind<AdminProtectMiddleware>(TYPE.AdminProtectMiddleware).to(AdminProtectMiddleware);
        this.container.bind<CommentService>(TYPE.CommentService).to(CommentService);
        this.container.bind<PDFService>(TYPE.PDFService).to(PDFService);

        logger.info('Application context initialised');

        eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            this.container.unbindAll();
            logger.info('Container unbindAll activated');
        });
    }

    public get<T>(serviceIdentifier: string | symbol): T {
        return this.container.get(serviceIdentifier);
    }

    public iocContainer(): Container {
        return this.container;
    }
}
