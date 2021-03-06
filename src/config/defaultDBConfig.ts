import DBConfig from '../interfaces/DBConfig';

const defaultDBConfig: DBConfig = {
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
  },
  production: {
    username: process.env.DB_FORM_DEFAULT_USERNAME,
    password: process.env.DB_FORM_DEFAULT_PASSWORD,
    database: process.env.DB_FORM_DEFAULT_DBNAME,
    host: process.env.DB_FORM_HOSTNAME,
    port: process.env.DB_FORM_PORT,
    dialect: 'postgres',
    native: false,
    dialectOptions: {
        ssl: process.env.DB_FORM_SSL ? process.env.DB_FORM_SSL === 'true' : false,
      },
    pool: {
        max: 100,
        min: 0,
        acquire: 1000000,
        idle: 200000,
      },
  },
};

export default defaultDBConfig;
