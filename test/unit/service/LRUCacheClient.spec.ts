import 'reflect-metadata';
import {expect} from "chai";
import {FormVersion} from "../../../src/model/FormVersion";
import {LRUCacheClient} from "../../../src/service/LRUCacheClient";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {User} from "../../../src/auth/User";
import {EventEmitter} from "events";

describe('LRUCacheClient', () => {
    const lruCacheClient = new LRUCacheClient(defaultAppConfig, new EventEmitter());
    afterEach(() => {
        lruCacheClient.clearTimer();
    });
    it('can delete key' , async() => {
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        await lruCacheClient.set("id", version, 1000);
        await lruCacheClient.del("id");

        const result = await lruCacheClient.get("id");
        expect(result).to.be.undefined;
    });

    it('can clearAll', async() => {
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        await lruCacheClient.set("id", version, 1000);
        const user = new User("id", "email");
        lruCacheClient.clearAll(user);

        const result = await lruCacheClient.get('id');
        expect(result).to.be.undefined;
    });
});
