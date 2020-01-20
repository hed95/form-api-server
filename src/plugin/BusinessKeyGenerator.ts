import {provide} from "inversify-binding-decorators";
import TYPE from "../constant/TYPE";
import {inject} from "inversify";
import AppConfig from "../interfaces/AppConfig";
import * as Redis from 'redis';
import moment from "moment";

@provide(TYPE.BusinessKeyGenerator)
export default class BusinessKeyGenerator {

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.RedisKeyGeneratorClient) private readonly redis: Redis.RedisClient) {
    }

    public async newBusinessKey() {
        const prefix = this.appConfig.businessKey.prefix;
        let today = moment();
        const currentDate = today.format("YYYYMMDD");
        const key = `${prefix}-${currentDate}`;
        const expiryAt = today.add(1, 'day').unix();
        return new Promise((resolve, reject) => {
            this.redis.multi()
                .incr(key)
                .expireat(key, expiryAt)
                .exec((err, reply) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(`${key}-${reply[0]}`)
                    }
                })
        });
    }


}
