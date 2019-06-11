module.exports = {
    db: {
        test: {
            dialect: 'sqlite',
            storage: ':memory:',
        },
        prod: {
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            host: process.env.DB_HOSTNAME,
            dialect: 'postgres',
            use_env_variable: 'DATABASE_URL',
            logging: false,
        },
    },
    keycloak: {
        url: process.env.AUTH_URL || 'http://keycloak.lodev.xyz/auth',
        resource: process.env.AUTH_RESOURCE || 'form-api-server',
        bearerOnly: process.env.AUTH_BEARER_ONLY || 'true',
        realm: process.env.AUTH_REALM || 'dev',
    },
};
