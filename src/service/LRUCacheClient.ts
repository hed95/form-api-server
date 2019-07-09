import {CacheClient} from 'type-cacheable';
import TYPE from '../constant/TYPE';
import {provide} from 'inversify-binding-decorators';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import {User} from '../auth/User';
import {TWO_MINUTES} from '../config/defaultAppConfig';
import LRUCache = require('lru-cache');
import {EventEmitter} from 'events';
import {ApplicationConstants} from '../util/ApplicationConstants';

@provide(TYPE.LRUCacheClient)
export class LRUCacheClient implements CacheClient {
    private readonly formCache: LRUCache<string, FormVersion>;
    private readonly intervalId: any;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.EventEmitter) private readonly eventEmitter: EventEmitter) {
        this.formCache = new LRUCache<string, FormVersion>({
            maxAge: appConfig.cache.form.maxAge,
            max: appConfig.cache.form.maxEntries,
        });
        this.intervalId = setInterval(() => {
            logger.debug(`Pruning cache items: ${this.formCache.itemCount}`);
            this.formCache.prune();
            logger.debug(`Pruned cache items: ${this.formCache.itemCount}`);
        }, +TWO_MINUTES);

        this.eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            this.formCache.reset();
            this.clearTimer();
        });
    }

    public del(cacheKey: string): Promise<any> {
        logger.debug(`Deleting cache key ${cacheKey}`);
        this.formCache.del(cacheKey);
        logger.debug(`Deleted cache key ${cacheKey}`);
        return Promise.resolve(true);
    }

    public get(cacheKey: string): Promise<any> {
        logger.debug(`Cache retrieval for ${cacheKey}`);
        return Promise.resolve(this.formCache.get(cacheKey));
    }

    public getClientTTL(): number {
        return this.appConfig.cache.form.maxAge;
    }

    public set(cacheKey: string, value: any, ttl?: number): Promise<any> {
        logger.debug(`storing data for cache key ${cacheKey}`);
        this.formCache.set(cacheKey, value, this.appConfig.cache.form.maxAge);
        logger.debug(`stored data for cache key ${cacheKey}`);
        return Promise.resolve(value);
    }

    public clearAll(user: User) {
        logger.warn(`${user.details.email} is clearing all form cache`);
        this.formCache.reset();
        logger.warn(`${user.details.email} cleared cache`);
    }

    public clearTimer(): void {
        if (this.intervalId) {
            logger.info('Clearing form cache interval');
            clearInterval(this.intervalId);
        }
    }

}
