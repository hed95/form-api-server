import 'reflect-metadata';
import {expect} from "chai";
import {AdminProtectMiddleware} from "../../../src/middleware/AdminProtectMiddleware";
import {MockResponse} from "../../MockResponse";
import {MockRequest} from "../../MockRequest";

describe('AdminProtectMiddleware', () => {

    const underTest: AdminProtectMiddleware = new AdminProtectMiddleware();

    let mockResponse: any;
    let mockRequest: any;


    beforeEach(() => {
        mockResponse = new MockResponse();
        mockRequest = new MockRequest("/forms", "/api/v1");
    });

    it('returns unauthorized', () => {
        let error: any = null;
        underTest.adminRoles = ['x'];
        underTest.handler(mockRequest, mockResponse, (err => {
            error = err;
        }));

        expect(error).to.be.not.null;
        expect(error.name).to.be.eq('UnauthorizedError');
    });

    it('returns ok', () => {
        let error: any = null;
        underTest.adminRoles = ['test'];
        underTest.handler(mockRequest, mockResponse, (err => {
            error = err;
        }));

        expect(error).to.be.undefined;
    });
});
