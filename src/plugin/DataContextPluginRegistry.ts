import logger from '../util/logger';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import KeycloakContext from './KeycloakContext';
import PromiseTimeoutHandler from './PromiseTimeoutHandler';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';

@provide(TYPE.DataContextPluginRegistry)
export default class DataContextPluginRegistry {

    private dataContextPlugin: any;

    constructor(@inject(TYPE.PromiseTimeoutHandler) private readonly promiseTimeoutHandler: PromiseTimeoutHandler,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {

    }

    public register(plugin: any): void {
        if (!plugin.createDataContext && typeof plugin.createDataContext !== 'function') {
            logger.warn(`Plugin does not` +
                ` have createDataContext method...so ignoring registration`);
            return;
        }
        this.dataContextPlugin = plugin;
        logger.info(`Data context plugin registered`);
        return null;
    }

    public async getDataContext(kauth: any, processInstanceId?: string, taskId?: string): Promise<any> {
        try {
            if (!this.dataContextPlugin) {
                return null;
            }
            const keycloakContext = new KeycloakContext(kauth);
            const [dataContext] = await this.promiseTimeoutHandler.timeoutPromise(
                +this.appConfig.dataContextPluginExecutionTimeout, Promise.all(
                [this.dataContextPlugin.createDataContext(keycloakContext, {
                    processInstanceId, taskId,
                })]));
            logger.info(`Data context resolved = ${dataContext !== null}`);
            return dataContext;
        } catch (e) {
            logger.error(`Unable to get data context due ${e.message ? e.message : e}`, e);
            return null;
        }
    }

    public getPlugin() {
        return this.dataContextPlugin;
    }

}
