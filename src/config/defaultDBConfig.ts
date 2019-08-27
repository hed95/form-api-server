import DBConfig from '../interfaces/DBConfig';

const defaultDBConfig: DBConfig = {
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
  },
  production: {
    username: '',
    password: 'sa',
    database: 'formdb3',
    host: 'localhost',
    port: '5432',
    dialect: 'postgres',
    native: false,
    dialectOptions: {
        ssl: process.env.DB_FORM_SSL ? process.env.DB_FORM_SSL === 'true' : false,
      },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
  },
};

export default defaultDBConfig;
