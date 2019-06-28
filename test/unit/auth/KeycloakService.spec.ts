import 'reflect-metadata';
import {KeycloakService} from "../../../src/auth/KeycloakService";
import {expect} from "chai";
import defaultAppConfig from "../../../src/config/defaultAppConfig";

describe('Keycloak Service', () => {

    const keycloakService: KeycloakService = new KeycloakService(defaultAppConfig);

    it('can get middleware', () => {
        expect(keycloakService.middleware()).to.be.not.undefined
    });
    it('can get protect', () => {
        expect(keycloakService.protect()).to.be.not.undefined
    });
    it('can get underlying keycloak', () => {
        expect(keycloakService.keycloakInstance()).to.be.not.undefined
    });
});
