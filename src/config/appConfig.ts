module.exports = {
    keycloak: {
        url: process.env.AUTH_URL || 'http://keycloak.lodev.xyz/auth',
        resource: process.env.AUTH_CLIENT_ID || 'form-api-server',
        bearerOnly: process.env.AUTH_BEARER_ONLY || 'true',
        realm: process.env.AUTH_REALM || 'dev',
        confidentialPort: 0,
    },
    admin: {
        roles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
    },
};
