import 'reflect-metadata';
// tslint:disable-next-line:no-implicit-dependencies
import {expect} from 'chai';
import DataContextPluginRegistry from '../../../src/plugin/DataContextPluginRegistry';
import PromiseTimeoutHandler from '../../../src/plugin/PromiseTimeoutHandler';
import defaultAppConfig from '../../../src/config/defaultAppConfig';

describe('DataContextPluginRegistry', () => {
    let dataContextPluginRegistry;

    beforeEach(() => {
        dataContextPluginRegistry = new DataContextPluginRegistry(
            new PromiseTimeoutHandler(defaultAppConfig),
            defaultAppConfig,
        );
    });

    it('can register plugin', () => {
        const plugin = {
            createDataContext: async () => {
                return Promise.resolve(null);
            },
        };
        dataContextPluginRegistry.register(plugin);
        const result = dataContextPluginRegistry.getPlugin();
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.not.null;
    });

    it('does not register plugin if createDataContext not present', () => {
        const plugin = {
            anotherMethod: () => {
                return null;
            },
        };
        dataContextPluginRegistry.register(plugin);
        const result = dataContextPluginRegistry.getPlugin();
        // tslint:disable-next-line:no-unused-expression
        expect(result).undefined;
    });

    it ('can get data context', async () => {
        const plugin = {
            createDataContext: async () => {
                return Promise.resolve({
                    processContext: {
                        variableName: {
                            name: 'test',
                        },
                    },
                });
            },
        };
        dataContextPluginRegistry.register(plugin);

        const result = await dataContextPluginRegistry.getDataContext({
            grant: {
                access_token: {
                    content: {
                        session_state: 'state',
                        email: 'email',
                        preferred_username: 'preferred_username',
                        given_name: 'given_name',
                        family_name: 'family_name',
                    },
                    token: 'token',
                },
                refresh_token: {
                    token: 'token',
                },
            },
        }, {
            processInstanceId: 'id',
            taskId: 'id',
        });

        expect(result.processContext.variableName.name).to.eq('test');
    });
});
