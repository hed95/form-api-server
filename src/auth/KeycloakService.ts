import {provide} from 'inversify-binding-decorators';
import Keycloak from 'keycloak-connect';
import TYPE from '../constant/TYPE';

@provide(TYPE.KeycloakService)
export class KeycloakService {
    private readonly authUrl: string;
    private readonly authBearerOnly: string;
    private readonly authResource: string;
    private readonly authRealm: string;
    private readonly keycloak: Keycloak;

    constructor() {
        const keycloakConfig: {
            url: string,
            resource: string,
            bearerOnly: string,
            realm: string,
        } = require('../config/config').keycloak;

        this.authUrl = keycloakConfig.url;
        this.authResource = keycloakConfig.resource;
        this.authBearerOnly = keycloakConfig.bearerOnly;
        this.authRealm = keycloakConfig.realm;

        this.keycloak = new Keycloak({}, {
            'auth-server-url': this.authUrl,
            'bearer-only': this.authBearerOnly,
            'enable-cors': true,
            'realm': this.authRealm,
            'resource': this.authResource,
        });
    }

    public middleware(): any {
        return this.keycloak.middleware();
    }

    public protect(): any {
        return this.keycloak.protect();
    }

    public keycloakInstance(): Keycloak {
        return this.keycloak;
    }

}
