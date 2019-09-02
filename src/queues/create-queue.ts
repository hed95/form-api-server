import Bull, {Queue} from 'bull';
import AppConfig from "../interfaces/AppConfig";

const createQueue = (appConfig: AppConfig,
                     name: string): Queue => {

    if (appConfig.redis.ssl) {
        return new Bull(name, {
            redis: {
                port: appConfig.redis.port,
                host: appConfig.redis.host,
                password: appConfig.redis.token,
                tls: {}
            }
        });
    }
    return new Bull(name, {
        redis: {
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,

        }
    });
};
export default createQueue;
