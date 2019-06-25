import AppConfig from '../interfaces/AppConfig';

const defaultAppConfig: AppConfig = {
    keycloak: {
        url: process.env.AUTH_URL || 'http://keycloak.lodev.xyz/auth',
        resource: process.env.AUTH_CLIENT_ID || 'form-api-server',
        bearerOnly: process.env.AUTH_BEARER_ONLY || 'true',
        realm: process.env.AUTH_REALM || 'dev',
        confidentialPort: 0,
        sslRequired: 'external',
    },
    admin: {
        roles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
    },
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split('|') : null,
    },
};

export default defaultAppConfig;
