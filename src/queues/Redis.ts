import AppConfig from '../interfaces/AppConfig';
import * as Redis from 'redis';
import logger from "../util/logger";

const redis = (appConfig: AppConfig): Redis.RedisClient => {
    let redisClient;
    if (appConfig.redis.ssl) {
        redisClient = Redis.createClient({
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,
            tls: {},
        });
    } else {
        redisClient = Redis.createClient({
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,
        });
    }
    redisClient.on('ready', () => {
        logger.info('Client ready');
    });
    redisClient.on('connect',()=> {
        logger.info('Redis client connected');
    });

    redisClient.on('error', (error) => {
        logger.error(`Could not connect to redis due to [${error.message}]`);
    });

    return redisClient;

};

export default redis;
