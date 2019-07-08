import AppConfig from '../interfaces/AppConfig';
import {ApplicationConstants} from '../util/ApplicationConstants';
const TWO_MINUTES = '120000';
const MAX_ENTRIES = 100;

const defaultAppConfig: AppConfig = {
    keycloak: {
        url: process.env.AUTH_URL,
        resource: process.env.AUTH_CLIENT_ID,
        bearerOnly: process.env.AUTH_BEARER_ONLY || 'true',
        realm: process.env.AUTH_REALM,
        confidentialPort: 0,
        sslRequired: 'external',
        tokenRefreshInterval: process.env.AUTH_TOKEN_REFRESH_INTERVAL || TWO_MINUTES,
        admin: {
            username: process.env.AUTH_ADMIN_USERNAME,
            password: process.env.AUTH_ADMIN_PASSWORD,
            clientId: process.env.AUTH_ADMIN_CLIENT_ID || 'admin-cli',
        },
    },
    admin: {
        roles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
    },
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split('|') : null,
    },
    log: {
        enabled: process.env.ENABLE_LOG_CHANGE ? process.env.ENABLE_LOG_CHANGE === 'true' : false,
        timeout: Number(process.env.LOG_CHANGE_TIMEOUT),
    },
    cache: {
        form: {
            maxAge: process.env.CACHE_FORM_MAX_AGE ? +process.env.CACHE_FORM_MAX_AGE : +TWO_MINUTES,
            maxEntries: process.env.CACHE_FORM_MAX_ENTRIES ? +process.env.CACHE_USER_FORM_ENTRIES : MAX_ENTRIES,
        },
        user: {
            maxAge: process.env.CACHE_USER_MAX_AGE ? +process.env.CACHE_USER_MAX_AGE : +TWO_MINUTES,
            maxEntries: process.env.CACHE_USER_MAX_ENTRIES ? +process.env.CACHE_USER_MAX_ENTRIES : MAX_ENTRIES,
        },
    },
    correlationIdRequestHeader: process.env.CORRELATION_ID_REQUEST_HEADER
        || ApplicationConstants.DEFAULT_CORRELATION_REQUEST_ID,

};

export default defaultAppConfig;
