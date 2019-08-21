import Bull, {Queue} from 'bull';
import {RedisClient} from 'redis';

const createQueue = (client: RedisClient,
                     subscriber: RedisClient,
                     defaultClient: RedisClient,
                     name: string): Queue => {
    const opts: { redis: object } = {
        redis: {
            opts: {
                createClient(type) {
                    switch (type) {
                        case 'client':
                            return client;
                        case 'subscriber':
                            return subscriber;
                        default:
                            return defaultClient;
                    }
                },
            },
        },
    };
    return new Bull(name, opts);
};
export default createQueue;
