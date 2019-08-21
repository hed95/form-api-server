import Redis from 'ioredis';
import AppConfig from '../interfaces/AppConfig';

const redis = (appConfig: AppConfig) => {
    if (appConfig.redis.ssl) {
        return new Redis({
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,
            tls: {
            }
        });
    }
    return new Redis({
        port: appConfig.redis.port,
        host: appConfig.redis.host,
        password: appConfig.redis.token,
    });

};

export default redis;
