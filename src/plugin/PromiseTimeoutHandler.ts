import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';

@provide(TYPE.PromiseTimeoutHandler)
export default class PromiseTimeoutHandler {
    public async timeoutPromise(timeoutInMs: number, promise: Promise<any>): Promise<any> {
        const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject(`Request timed out after ${timeoutInMs} ms`);
            }, timeoutInMs);
        });
        return Promise.race([
            promise,
            timeout,
        ]);
    }
}
