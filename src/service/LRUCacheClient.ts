import {CacheClient} from 'type-cacheable';
import TYPE from '../constant/TYPE';
import {provide} from 'inversify-binding-decorators';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import LRUCache = require('lru-cache');

@provide(TYPE.LRUCacheClient)
export class LRUCacheClient implements CacheClient {
    private readonly formCache: LRUCache<string, FormVersion>;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        this.formCache = new LRUCache<string, FormVersion>({
            maxAge: appConfig.cache.form.maxAge,
            max: appConfig.cache.form.maxEntries,
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

}
