import 'reflect-metadata';
import {expect} from "chai";
import {HealthController} from "../../../src/controller";
import 'mocha';
import {MockResponse} from "../../MockResponse";

describe("Health Controller", () => {

    const healthController = new HealthController();
    let mockResponse: any;

    beforeEach(() => {
        mockResponse = new MockResponse();
    });

    it('can get health', () => {
        healthController.health(mockResponse);
        const data = mockResponse.getJsonData();
        expect(data.uptime).to.be.not.null;
    });

    it('can get readiness', () => {
        const result = healthController.readiness();
        expect(result).to.eq("READY");
    });
});
