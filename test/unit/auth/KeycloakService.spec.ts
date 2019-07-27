import 'reflect-metadata';
import {KeycloakService} from "../../../src/auth/KeycloakService";
import {expect} from "chai";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {EventEmitter} from "events";
import {User} from "../../../src/auth/User";

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
        keycloakService.getUserCache().set("id", new User("a", "b", []));
        const user: User = new User("id","id", []);
        keycloakService.clearUserCache(user);
        expect( keycloakService.getUserCache().itemCount).to.be.eq(0);
    });

    it('can get user from cache', async () => {
        keycloakService.getUserCache().set("b", new User("b", "b", []));
        const user = await keycloakService.getUser("b");
        expect(user.details.email).to.be.eq("b");
    });

});
