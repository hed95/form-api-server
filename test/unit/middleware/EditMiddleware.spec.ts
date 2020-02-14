import 'reflect-metadata';
import {expect} from "chai";
import {MockResponse} from "../../MockResponse";
import {MockRequest} from "../../MockRequest";
// @ts-ignore
import httpContext from 'express-http-context';

import {EditMiddleware} from "../../../src/middleware/EditMiddleware";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {User} from '../../../src/auth/User';
import {Role} from '../../../src/model/Role';

const sinon = require("sinon");

const expressHttpContext = require("express-http-context");

describe('EditMiddleware', () => {

    let underTest: EditMiddleware;

    let mockResponse: any;
    let mockRequest: any;
    let config = defaultAppConfig;
    let stubGet;
    beforeEach(() => {
        mockResponse = new MockResponse();
        mockRequest = new MockRequest("/forms", "/api/v1");
        underTest = new EditMiddleware(config);
        stubGet = sinon.stub(expressHttpContext, "get")
    });


    afterEach(() => {
        stubGet.restore();
    });

    it('throws unauthorized error if keycloak role not present', () => {
        config.edit.roles.push('apples');
        let error = null;
        underTest.handler(mockRequest, mockResponse, ((err) => {
            error = err;
        }));
        expect(error).to.be.not.null;
        expect(error.name).to.be.eq('UnauthorizedError');
    });

    it('throws unauthorized error if keycloak role not present in httpContext', () => {
        config.edit.roles.push('apples');

        Object.assign(Role, {});
        const role: Role = Object.assign(Role.prototype, {});
        role.name = 'test';
        role.id = 'test';
        const user = new User("email", "email", [role]);
        stubGet.returns(user);

        let error = null;
        underTest.handler(mockRequest, mockResponse, ((err) => {
            error = err;
        }));
        expect(error).to.be.not.null;
        expect(error.name).to.be.eq('UnauthorizedError');
    });

    it('no error is role present in httpContext', () => {
        config.edit.roles.push('apples');

        Object.assign(Role, {});
        const role: Role = Object.assign(Role.prototype, {});
        role.name = 'apples';
        role.id = 'apples';
        const user = new User("email", "email", [role]);
        stubGet.returns(user);

        let error = null;
        underTest.handler(mockRequest, mockResponse, ((err) => {
            error = err;
        }));
        expect(error).to.be.undefined;
    });
    it('no error is role present in request', () => {
        config.edit.roles.push('test');

        stubGet.returns(null);

        let error = null;
        underTest.handler(mockRequest, mockResponse, ((err) => {
            error = err;
        }));
        expect(error).to.be.undefined;
    });
});
