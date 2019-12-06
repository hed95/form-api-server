import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import logger from '../util/logger';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';

@provide(TYPE.PromiseTimeoutHandler)
export default class PromiseTimeoutHandler {
    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {

    }

    public async timeoutPromise(promise: Promise<any>,
                                defaultOperation?: any,
                                timeoutInMs?: number): Promise<any> {
        const timeoutInMilliseconds = timeoutInMs ? timeoutInMs
            : +this.appConfig.dataContextPluginExecutionTimeout;

        const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                const message = `Request timed out after ${timeoutInMilliseconds} ms`;
                logger.warn(message);
                if (defaultOperation) {
                    resolve(defaultOperation());
                } else {
                    reject(new Error(message));
                }
            }, timeoutInMilliseconds);
        });
        return Promise.race([
            promise,
            timeout,
        ]);
    }
}
