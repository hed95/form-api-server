interface AppConfig {
    keycloak: {
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
        user: {
            maxAge: number,
            maxEntries: number,
        },
    };
    correlationIdRequestHeader: string;
}

export default AppConfig;
