import {RequestHandler} from 'express';
import {provide} from 'inversify-binding-decorators';
import Keycloak from 'keycloak-connect';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import KcAdminClient from 'keycloak-admin';
import logger from '../util/logger';
import {User} from './User';
import {Role} from '../model/Role';
import {getToken} from 'keycloak-admin/lib/utils/auth';

@provide(TYPE.KeycloakService)
export class KeycloakService {

    private readonly keycloak: Keycloak;
    private readonly kcAdminClient: KcAdminClient;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        const keycloak: any = appConfig.keycloak;
        this.keycloak = new Keycloak({}, {
            'auth-server-url': keycloak.url,
            'bearer-only': keycloak.bearerOnly,
            'enable-cors': true,
            'realm': keycloak.realm,
            'resource': keycloak.resource,
            'sslRequired': keycloak.sslRequired,
            'confidentialPort': keycloak.confidentialPort,
        });
        this.kcAdminClient = new KcAdminClient({
            baseUrl: keycloak.url,
            realmName: keycloak.realm,
        });
        const admin: { clientId: string, username: string, password: string } = keycloak.admin;
        const credentials = {
            username: admin.username,
            password: admin.password,
            grantType: 'password',
            clientId: admin.clientId,
        };
        this.kcAdminClient.auth(credentials).then(() => {
            logger.info('kcAdminClient successfully initialised');
            setInterval(async () => {
                getToken({
                    baseUrl : keycloak.url,
                    realmName: keycloak.realm,
                    credentials,
                }).then((token: any) => {
                   this.kcAdminClient.setAccessToken(token.accessToken);
                });
            }, +keycloak.tokenRefreshInterval);

        }).catch((err) => {
            logger.error('Failed to initialise kcAdminClient', err);
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

    public async getUser(email: string): Promise<User> {
        try {
            const result = await this.kcAdminClient.users.find({
                email,
                max: 1,
            });
            if (result && result.length === 1) {
                const data = result[0];
                const realmRoles = await this.kcAdminClient.users.listRealmRoleMappings(
                    {
                        id: data.id,
                        realm: this.appConfig.keycloak.realm,
                    },
                );
                const roles = realmRoles.map((realmRole) => {
                    return new Role({
                        name: realmRole.name,
                        description: realmRole.description,
                        active: true,
                    });
                });

                if (roles.length !== 0) {
                    return Promise.resolve(new User(data.email, data.email, roles));
                }
                return Promise.resolve(null);
            }
            return Promise.resolve(null);
        } catch (e) {
            logger.error('Failed to get user details', e);
            return Promise.resolve(null);
        }

    }

}
