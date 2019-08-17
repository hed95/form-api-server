import Bull, { Queue } from 'bull';
import IORedis from 'ioredis';

const createQueue = (client: IORedis.Redis,
                     subscriber: IORedis.Redis,
                     defaultClient: IORedis.Redis,
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
