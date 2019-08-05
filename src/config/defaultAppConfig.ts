import AppConfig from '../interfaces/AppConfig';
import {ApplicationConstants} from '../util/ApplicationConstants';

export const TWO_MINUTES = '120000';
const MAX_ENTRIES = 100;

const defaultAppConfig: AppConfig = {
    keycloak: {
        url: process.env.KEYCLOAK_URL,
        resource: process.env.FORM_API_KEYCLOAK_CLIENT_ID,
        bearerOnly: process.env.FORM_API_KEYCLOAK_BEARER_ONLY || 'true',
        realm: process.env.KEYCLOAK_REALM,
        confidentialPort: 0,
        sslRequired: 'external',
        tokenRefreshInterval: process.env.KEYCLOAK_TOKEN_REFRESH_INTERVAL || TWO_MINUTES,
        admin: {
            username: process.env.FORM_API_KEYCLOAK_ADMIN_USERNAME,
            password: process.env.FORM_API_KEYCLOAK_ADMIN_PASSWORD,
            clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli',
        },
    },
    admin: {
        roles: process.env.FORM_API_KEYCLOAK_ADMIN_ROLES ? process.env.FORM_API_KEYCLOAK_ADMIN_ROLES.split(',') : [],
    },
    cors: {
        origin: process.env.FORM_API_CORS_ORIGIN ? process.env.FORM_API_CORS_ORIGIN.split(',') : null,
    },
    log: {
        enabled: process.env.FORM_API_LOG_ENABLE_CHANGE ? process.env.FORM_API_ENABLE_CHANGE === 'true' : false,
        timeout: Number(process.env.FORM_API_LOG_CHANGE_TIMEOUT),
    },
    cache: {
        role: {
            maxAge: process.env.FORM_API_CACHE_ROLE_MAX_AGE ? +process.env.FORM_API_CACHE_ROLE_MAX_AGE : +TWO_MINUTES,
            maxEntries: process.env.FORM_API_CACHE_ROLE_MAX_ENTRIES ? +process.env.FORM_API_CACHE_USER_ROLE_ENTRIES : MAX_ENTRIES,
        },
        form: {
            maxAge: process.env.FORM_API_CACHE_FORM_MAX_AGE ? +process.env.FORM_API_CACHE_FORM_MAX_AGE : +TWO_MINUTES,
            maxEntries: process.env.FORM_API_CACHE_FORM_MAX_ENTRIES ? +process.env.FORM_API_CACHE_USER_FORM_ENTRIES : MAX_ENTRIES,
        },
        user: {
            maxAge: process.env.FORM_API_CACHE_USER_MAX_AGE ? +process.env.FORM_API_CACHE_USER_MAX_AGE : +TWO_MINUTES,
            maxEntries: process.env.FORM_API_CACHE_USER_MAX_ENTRIES ? +process.env.FORM_API_CACHE_USER_MAX_ENTRIES : MAX_ENTRIES,
        },
    },
    query: {
        log: {
            enabled: process.env.FORM_API_LOG_ENABLE_QUERY ? (process.env.FORM_API_LOG_ENABLE_QUERY === 'true') : false,
        },
    },
    correlationIdRequestHeader: process.env.FORM_API_CORRELATION_ID_REQUEST_HEADER
        || ApplicationConstants.DEFAULT_CORRELATION_REQUEST_ID,

};

export default defaultAppConfig;
