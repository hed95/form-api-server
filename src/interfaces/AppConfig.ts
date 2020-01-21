interface AppConfig {
    dataContextPluginLocation: string;
    dataContextPluginExecutionTimeout: string;
    businessKey: {
        enabled: boolean,
        prefix: string,
    };
    keycloak: {
        protocol: string,
        url: string,
        resource: string,
        bearerOnly: string,
        realm: string,
        confidentialPort: number,
        sslRequired: string,
        tokenRefreshInterval: string
        admin: {
            username: string,
            password: string,
            clientId: string,
        },
    };
    admin: {
        roles: string[],
    };
    cors: {
        origin: string[],
    };
    log: {
        enabled: boolean,
        timeout: number,
    };
    cache: {
        role: {
            maxAge: number,
            maxEntries: number,
        }
        form: {
            maxAge: number,
            maxEntries: number,
        },
        user: {
            maxAge: number,
            maxEntries: number,
        },
    };
    query: {
        log: {
            enabled: boolean,
        },
    };
    redis: {
        ssl: boolean,
        port: number,
        host: string,
        token: string,
    };
    correlationIdRequestHeader: string;
}

export default AppConfig;
