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
import {ApplicationConstants} from '../constant/ApplicationConstants';
import {PDFService} from '../service/PDFService';
import {Queue} from 'bull';
import createQueue from '../queues/create-queue';
import redis from '../queues/Redis';
import {PdfJob} from '../model/PdfJob';
import cacheManager, {useRedisAdapter} from 'type-cacheable';
import CacheManager from 'type-cacheable/dist/CacheManager';
import JsonPathEvaluator from '../plugin/JsonPathEvaluator';
import DataContextPluginRegistry from '../plugin/DataContextPluginRegistry';
import FormTranslator from '../plugin/FormTranslator';
import PromiseTimeoutHandler from '../plugin/PromiseTimeoutHandler';
import Prometheus, {register} from 'prom-client';
import {getFormCountGenerator, updateFormCounter} from '../util/metrics';

export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton',

        });
        const eventEmitter = new EventEmitter();
        this.container.bind<EventEmitter>(TYPE.EventEmitter).toConstantValue(eventEmitter);
        this.container.bind<AppConfig>(TYPE.AppConfig).toConstantValue(defaultAppConfig);
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
        this.container.bind<JsonPathEvaluator>(TYPE.JsonPathEvaluator).to(JsonPathEvaluator);
        this.container.bind<DataContextPluginRegistry>(TYPE.DataContextPluginRegistry).to(DataContextPluginRegistry);
        this.container.bind<FormTranslator>(TYPE.FormTranslator).to(FormTranslator);
        const pdfQueue: Queue<PdfJob> = createQueue(defaultAppConfig, ApplicationConstants.PDF_QUEUE_NAME);
        this.container.bind<Queue>(TYPE.PDFQueue).toConstantValue(pdfQueue);
        this.container.bind<PromiseTimeoutHandler>(TYPE.PromiseTimeoutHandler).to(PromiseTimeoutHandler);
        useRedisAdapter(redis(defaultAppConfig));

        this.container.bind<CacheManager>(TYPE.CacheManager).toConstantValue(cacheManager);

        this.container.bind<Prometheus.Counter>(TYPE.GetFormCountGenerator)
            .toConstantValue(getFormCountGenerator('form_api_server_'));

        this.container.bind<Prometheus.Counter>(TYPE.UpdateFormCountGenerator)
            .toConstantValue(updateFormCounter('form_api_server_'));

        logger.info('Application context initialised');

        eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            register.clear();
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
