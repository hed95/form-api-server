module.exports = {
    keycloak: {
        url: process.env.AUTH_URL || 'http://keycloak.lodev.xyz/auth',
        resource: process.env.AUTH_RESOURCE || 'form-api-server',
        bearerOnly: process.env.AUTH_BEARER_ONLY || 'true',
        realm: process.env.AUTH_REALM || 'dev',
    },
};
