import {RequestHandler} from 'express';
import {provide} from 'inversify-binding-decorators';
import Keycloak from 'keycloak-connect';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';

@provide(TYPE.KeycloakService)
export class KeycloakService {

    private readonly keycloak: Keycloak;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        const keycloakConfig = this.appConfig.keycloak;
        const authUrl: string = keycloakConfig.url;
        const authResource: string = keycloakConfig.resource;
        const authBearerOnly: string = keycloakConfig.bearerOnly;
        const authRealm: string = keycloakConfig.realm;
        const sslRequired: string = keycloakConfig.sslRequired;
        const confidentialPort: number = keycloakConfig.confidentialPort;

        this.keycloak = new Keycloak({}, {
            'auth-server-url': authUrl,
            'bearer-only': authBearerOnly,
            'enable-cors': true,
            'realm': authRealm,
            'resource': authResource,
            'sslRequired': sslRequired,
            'confidentialPort': confidentialPort
        });
    }

    public middleware(): RequestHandler {
        return this.keycloak.middleware();
    }

    public protect(): RequestHandler {
        return this.keycloak.protect();
    }

    public keycloakInstance(): Keycloak {
        return this.keycloak;
    }

}
