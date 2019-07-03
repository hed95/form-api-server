interface AppConfig {
    keycloak: {
        url: string,
        resource: string,
        bearerOnly: string,
        realm: string,
        confidentialPort: number,
        sslRequired: string,
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
    correlationIdRequestHeader: string;
}

export default AppConfig;
