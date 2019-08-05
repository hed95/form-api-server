import DBConfig from '../interfaces/DBConfig';

const defaultDBConfig: DBConfig = {
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
    },
    production: {
        username: process.env.FORM_API_DB_USERNAME,
        password: process.env.FORM_API_DB_PASSWORD,
        database: process.env.FORM_API_DB_NAME,
        host: process.env.FORM_API_DB_HOSTNAME,
        port: process.env.FORM_API_DB_PORT,
        dialect: 'postgres',
        native: false,
        dialectOptions: {
            ssl: process.env.FORM_API_DB_SSL ? process.env.FORM_API_DB_SSL === 'true' : false,
        },
        pool: {
            max: 10,
            min: 0,
            idle: 10000,
        },
    },
};

export default defaultDBConfig;
