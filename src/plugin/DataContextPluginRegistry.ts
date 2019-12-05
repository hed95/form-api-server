import logger from '../util/logger';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import KeycloakContext from './KeycloakContext';

@provide(TYPE.DataContextPluginRegistry)
export default class DataContextPluginRegistry {

    private dataContextPlugin: any;

    public register(plugin: any): void {
        if (!plugin.createDataContext && typeof plugin.createDataContext !== 'function') {
            logger.warn(`Plugin ${plugin.constructor.name} does not` +
                ` have createDataContext method...so ignoring registration`);
            return;
        }
        this.dataContextPlugin = plugin;
        logger.info(`Plugin ${plugin.constructor.name} registered`);
        return null;
    }

    public async getDataContext(kauth: any, {processInstanceId, taskId}): Promise<any> {
        if (!this.dataContextPlugin) {
            return null;
        }
        try {
            const keycloakContext = new KeycloakContext(kauth);
            const [dataContext] = await Promise.all(
                [this.dataContextPlugin.createDataContext(keycloakContext, {
                    processInstanceId,
                    taskId,
                })]);
            logger.info(`Data context resolved = ${dataContext !== null}`);
            return dataContext;
        } catch (e) {
            logger.error(`Unable to get data context due ${e.message}`, e);
            return null;
        }
    }

    public getPlugin() {
        return this.dataContextPlugin;
    }

}
