import 'reflect-metadata';
import {expect} from "chai";
import {HealthController} from "../../../src/controller";
import 'mocha';
import {MockResponse} from "../../MockResponse";
import {Substitute} from "@fluffy-spoon/substitute";
import {SequelizeProvider} from "../../../src/model/SequelizeProvider";
import {Sequelize} from "sequelize-typescript";

describe("Health Controller", () => {

    const sequelizeProvider = Substitute.for<SequelizeProvider>();
    const healthController = new HealthController(sequelizeProvider);
    let mockResponse: any;

    beforeEach(() => {
        mockResponse = new MockResponse();
    });

    it('can get health', () => {
        healthController.health(mockResponse);
        const data = mockResponse.getJsonData();
        expect(data.uptime).to.be.not.null;
    });

    it('can get readiness', async () => {
        // @ts-ignore
        const sequelize = Substitute.for<Sequelize>();
        sequelizeProvider.getSequelize().returns(sequelize);
        sequelize.authenticate().isResolved();
        await healthController.readiness(mockResponse);
        const data = mockResponse.getJsonData();
        expect(data.status).to.be.eq('READY');
    });
});
