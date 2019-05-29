module.exports = {
    test: {
        dialect: 'sqlite',
        storage: ':memory:'
    },
    prod: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'postgres',
        use_env_variable: 'DATABASE_URL',
        logging: false
    }
};
