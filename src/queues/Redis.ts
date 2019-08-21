import AppConfig from '../interfaces/AppConfig';
import * as Redis from 'redis';

const redis = (appConfig: AppConfig): Redis.RedisClient => {
    if (appConfig.redis.ssl) {
        return Redis.createClient({
            port: appConfig.redis.port,
            host: appConfig.redis.token,
            password: appConfig.redis.token,
            tls: {},
        });
    }
    return Redis.createClient({
        port: appConfig.redis.port,
        host: appConfig.redis.token,
        password: appConfig.redis.token,
    });

};

export default redis;
