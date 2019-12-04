import logger from '../util/logger';

export default class DataContextPluginRegistry {

    private plugins = new Set([]);

    public register(plugin: any): void {
        if (!plugin.hasOwnProperty('getDataContext')) {
            logger.warn(`Plugin ${plugin.name} does not` +
                ` have getDataContext method...so ignoring registration`);
            return;
        }
        this.plugins.add(plugin);
        return null;
    }

    public load(path: string): void {
        logger.info(`Loading plugins from ${path}`);

        return null;
    }
}
