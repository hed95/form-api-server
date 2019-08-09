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
import LRUCache from 'lru-cache';
import {EventEmitter} from 'events';
import {ApplicationConstants} from '../util/ApplicationConstants';

@provide(TYPE.KeycloakService)
export class KeycloakService {

    private readonly keycloak: Keycloak;
    private readonly kcAdminClient: KcAdminClient;

    private readonly userCache: LRUCache<string, User>;
    private intervalId: any;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.EventEmitter) private readonly eventEmitter: EventEmitter) {
        const keycloak: any = appConfig.keycloak;
        this.keycloak = new Keycloak({}, {
            'auth-server-url': keycloak.protocol.concat(keycloak.url),
            'bearer-only': keycloak.bearerOnly,
            'enable-cors': true,
            'realm': keycloak.realm,
            'resource': keycloak.resource,
            'sslRequired': keycloak.sslRequired,
            'confidentialPort': keycloak.confidentialPort,
        });
        this.kcAdminClient = new KcAdminClient({
            baseUrl: keycloak.protocol.concat(keycloak.url),
            realmName: keycloak.realm,
        });
        const admin: { clientId: string, username: string, password: string } = keycloak.admin;
        const credentials = {
            username: admin.username,
            password: admin.password,
            grantType: 'password',
            clientId: admin.clientId,
        };
        this.userCache = new LRUCache({
            max: appConfig.cache.user.maxEntries,
            maxAge: appConfig.cache.user.maxAge,
        });
        this.kcAdminClient.auth(credentials).then(() => {
            logger.info('kcAdminClient successfully initialised');
            this.intervalId = setInterval(async () => {
                getToken({
                    baseUrl: keycloak.protocol.concat(keycloak.url),
                    realmName: keycloak.realm,
                    credentials,
                }).then((token: any) => {
                    this.kcAdminClient.setAccessToken(token.accessToken);
                    logger.debug(`Pruning user cache for stale objects`);
                    this.userCache.prune();
                });
            }, +keycloak.tokenRefreshInterval);

        }).catch((err) => {
            logger.error('Failed to initialise kcAdminClient', err);
        });

        this.eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            this.userCache.reset();
            this.clearTimer();
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

    public clearUserCache(user: User): void {
        logger.info(`${user.details.email} is deleting user cache entries`);
        this.userCache.reset();
        logger.info(`${user.details.email} deleted all user cache entries`);
    }

    public async getUser(email: string): Promise<User> {
        let user: User = this.userCache.get(email);
        if (!user) {
            logger.debug(`Cache miss for user: ${email}`);
            user = await this.loadUser(email);
            if (user) {
                logger.debug(`Found user ${email}...setting into local cache`);
                this.userCache.set(user.details.email, user, this.appConfig.cache.user.maxAge);
                logger.debug(`${email} added to cache`);
                return Promise.resolve(user);
            } else {
                logger.warn(`User ${email} was not found so not storing in cache`);
                return Promise.resolve(null);
            }
        }
        logger.debug(`Cache hit for user: ${email}`);
        return Promise.resolve(user);
    }

    public clearTimer() {
        if (this.intervalId) {
            logger.info('Clearing user cache interval timer');
            clearInterval(this.intervalId);
        }
    }

    public getUserCache(): LRUCache<string, User> {
        return this.userCache;
    }

    private async loadUser(email: string): Promise<User> {
        try {
            const result = await this.kcAdminClient.users.find({
                email,
                max: 1,
            });
            if (result && result.length === 1) {
                logger.debug(`Found user ${email}...now looking for roles`);
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
                    logger.debug(`Found roles for user ${email}`);
                    return Promise.resolve(new User(data.email, data.email, roles));
                }
                return Promise.resolve(null);
            }
            logger.warn(`Failed to find user details for ${email}`);
            return Promise.resolve(null);
        } catch (e) {
            logger.error('Failed to get user details', {
                error: e.message,
            });
            return Promise.resolve(null);
        }

    }
}
