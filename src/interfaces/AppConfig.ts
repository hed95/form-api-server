interface AppConfig {
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
    aws: {
        s3: {
            endpoint: string,
            useSSL: boolean,
            port: number,
            accessKey: string,
            secretKey: string
            buckets: {
                pdf: string,
            },
        },
    };
    redis: {
        port: number,
        host: string,
        token: string,
        ssl: boolean,
    };
    correlationIdRequestHeader: string;
}

export default AppConfig;
