import 'reflect-metadata';
import 'mocha';
import {ApplicationContext} from "../../src/container/ApplicationContext";
import TYPE from "../../src/constant/TYPE";
import {SequelizeProvider} from "../../src/model/SequelizeProvider";
import {cleanUpMetadata} from "inversify-express-utils";
import {KeycloakService} from "../../src/auth/KeycloakService";
import {Queue} from "bull";

import * as createQueueModule from "../../src/queues/create-queue";
import * as redisFunction from '../../src/queues/Redis';
import {ImportMock} from 'ts-mock-imports';
import {Substitute} from "@fluffy-spoon/substitute";
import {PdfJob} from "../../src/model/PdfJob";
import mockRedis from 'redis-mock';

ImportMock.mockFunction(redisFunction, "default", mockRedis.createClient(1, 'x', {}));
ImportMock.mockFunction(createQueueModule, "default", Substitute.for<Queue>());

export let sequelizeProvider: SequelizeProvider;
export const applicationContext: ApplicationContext = new ApplicationContext();

beforeEach(() => {
    cleanUpMetadata();
});

before(async () => {
    process.env.NODE_ENV = "test";
    sequelizeProvider = applicationContext.get(TYPE.SequelizeProvider);
    await sequelizeProvider.getSequelize().sync({force: true});
    await SequelizeProvider.initDefaultRole();
});

afterEach(async () => {
    const keycloakService: KeycloakService = applicationContext.get(TYPE.KeycloakService);
    keycloakService.clearTimer();

    const pdfQueue: Queue<PdfJob> = applicationContext.get(TYPE.PDFQueue);
    await pdfQueue.close();
});
