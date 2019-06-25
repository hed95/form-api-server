interface DBConfig {
    test: {
        dialect: string,
        storage: string,
    };
    production: {
        username: string,
        password: string,
        database: string,
        host: string,
        port: string,
        dialect: string,
        native: boolean,
    };
}

export default DBConfig;
