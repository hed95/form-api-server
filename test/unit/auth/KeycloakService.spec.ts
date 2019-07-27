import 'reflect-metadata';
import {KeycloakService} from "../../../src/auth/KeycloakService";
import {expect} from "chai";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {EventEmitter} from "events";

describe('Keycloak Service', () => {

    const keycloakService: KeycloakService = new KeycloakService(defaultAppConfig, new EventEmitter());

    it('can get middleware', () => {
        expect(keycloakService.middleware()).to.be.not.undefined
    });
    it('can get protect', () => {
        expect(keycloakService.protect()).to.be.not.undefined
    });
    it('can get underlying keycloak', () => {
        expect(keycloakService.keycloakInstance()).to.be.not.undefined
    });
    it('can clear userCache', () => {

    });

    it('can get user from cache', () => {

    });

    it('can load user', () => {

    });
});
