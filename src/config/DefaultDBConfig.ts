import DBConfig from "../interfaces/DBConfig";

const dbConfig: DBConfig = {
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        native: false,
    },
};

export default dbConfig;
