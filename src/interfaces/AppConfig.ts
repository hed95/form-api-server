interface AppConfig {
    keycloak: {
        url: string,
        resource: string,
        bearerOnly: string,
        realm: string,
        confidentialPort: number,
        sslRequired: string,
    };
    admin: {
        roles: string[],
    };
    cors: {
        origin: string[],
    };
}

export default AppConfig;
