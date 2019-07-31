import 'reflect-metadata';
import {expect} from "chai";
import {MockResponse} from "../../MockResponse";
import {MockRequest} from "../../MockRequest";
import {ProtectMiddleware} from "../../../src/middleware/ProtectMiddleware";
import {KeycloakService} from "../../../src/auth/KeycloakService";
import {Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import * as express from 'express';

describe('ProtectMiddleware', () => {

    let underTest: ProtectMiddleware;

    let mockResponse: any;
    let mockRequest: any;
    let next: any;
    let keycloakService: SubstituteOf<KeycloakService>;
    let called = false;

    beforeEach(() => {
        mockResponse = new MockResponse();
        mockRequest = new MockRequest("/forms", "/api/v1");
        keycloakService = Substitute.for<KeycloakService>();
        next = Substitute.for<express.NextFunction>();
        keycloakService.protect().returns((mockRequest, mockResponse, next) => {
           called = true;
        });
        underTest = new ProtectMiddleware(keycloakService);
    });

    it('runs keycloak', () => {
        underTest.handler(mockRequest, mockResponse, next);
        expect(called).to.be.eq(true);
    })
});
