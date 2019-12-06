import 'reflect-metadata';
import PromiseTimeoutHandler from '../../../src/plugin/PromiseTimeoutHandler';
import defaultAppConfig from '../../../src/config/defaultAppConfig';
// tslint:disable-next-line:no-implicit-dependencies
import * as chai from 'chai';
// @ts-ignore
// tslint:disable-next-line:no-implicit-dependencies
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('PromiseTimeoutHandler', () => {
    let timeoutId;
    afterEach(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });
    it('can execute default operation if timeout resolves before promise', async () => {
        let variable = false;
        const defaultOperation = () => {
            variable = true;
        };

        defaultAppConfig.dataContextPluginExecutionTimeout = '1';
        const handler: PromiseTimeoutHandler = new PromiseTimeoutHandler(defaultAppConfig);

        // tslint:disable-next-line:no-magic-numbers
        const result = await handler.timeoutPromise(new Promise((resolve) =>
            // tslint:disable-next-line:no-magic-numbers
            timeoutId = setTimeout(resolve, 10000)), defaultOperation);

        expect(variable).to.be.true;
    });
    it('rejects promise if no default op and timeout exceeded', async () => {
        defaultAppConfig.dataContextPluginExecutionTimeout = '1';
        const handler: PromiseTimeoutHandler = new PromiseTimeoutHandler(defaultAppConfig);
        // tslint:disable-next-line:no-magic-numbers
        try {
            await handler.timeoutPromise(new Promise((resolve) =>
                // tslint:disable-next-line:no-magic-numbers
                timeoutId = setTimeout(resolve, 10000)));
        } catch (e) {
            expect(e.message).to.be.eq('Request timed out after 1 ms');
        }

    });
});
