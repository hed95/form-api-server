import 'reflect-metadata';
import JsonPathEvaluator from '../../../src/plugin/JsonPathEvaluator';
// tslint:disable-next-line:no-implicit-dependencies
import {expect} from 'chai';
import FormTranslator from '../../../src/plugin/FormTranslator';
import {FormVersion} from '../../../src/model/FormVersion';
import {
    dataUrlForm,
    processContextForm,
    simpleForm,
    simpleFormBusinessKeyWithDefaultValue,
    simpleFormWithoutBusinessKey,
    imgForm, iframeForm, shiftForm, taskContextForm, userDetailsContextForm, noContextData,
} from './formsFixtures';
import defaultAppConfig from '../../../src/config/defaultAppConfig';
import PromiseTimeoutHandler from '../../../src/plugin/PromiseTimeoutHandler';
import DataContextPluginRegistry from '../../../src/plugin/DataContextPluginRegistry';
import KeycloakContext from '../../../src/plugin/KeycloakContext';

describe('Form Translator ', () => {
    const jsonPathEvaluator = new JsonPathEvaluator();
    let dataContextRegistory;
    let formTranslator;
    const dataContext: Record<any, any> = {
        processContext: {
            businessKey: 'businessKey',
            variable: {
                firstName: 'Joe',
                surname: 'Bloggs',
            },
        },
    };
    const kAuth = {
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
    };
    beforeEach(() => {
        defaultAppConfig.dataContextPluginLocation = '10';
        const promiseTimeoutHandler = new PromiseTimeoutHandler(defaultAppConfig);
        dataContextRegistory = new DataContextPluginRegistry(promiseTimeoutHandler, defaultAppConfig);
        dataContextRegistory.register({
            createDataContext: async () => {
                return Promise.resolve(dataContext);
            },
        });
        formTranslator = new FormTranslator(jsonPathEvaluator, promiseTimeoutHandler, dataContextRegistory);
    });

    const form = {
        name: 'form',
        title: '{$.processContext.businessKey} Title',
        display: 'form',
        components: [{
            key: 'test',
            defaultValue: '{$.processContext.variable.firstName}',
        },
            {
                key: 'testA',
                defaultValue: '{$.processContext.variable.surname}',
            }],
    };

    Object.assign(FormVersion, {});
    // @ts-ignore
    const version: FormVersion = {...FormVersion.prototype};

    afterEach(() => {
        version.schema = null;
    });

    it('can parse expression', async () => {
        version.schema = form;
        const result = await formTranslator.translate(version, new KeycloakContext(kAuth));
        expect(result.schema.title).to.be.eq('businessKey Title');
        expect(result.schema.components[0].defaultValue).to.be.eq('Joe');
        expect(result.schema.components[1].defaultValue).to.be.eq('Bloggs');
    });

    [dataUrlForm,
        processContextForm,
        simpleForm,
        simpleFormWithoutBusinessKey,
        simpleFormBusinessKeyWithDefaultValue,
        imgForm,
        iframeForm,
        shiftForm,
        taskContextForm,
        userDetailsContextForm,
        noContextData,
    ].forEach((formToTest: any) => {
        it(`it can parse ${formToTest.name}`, async () => {
            version.schema = formToTest;
            const result = await formTranslator.translate(version, new KeycloakContext(kAuth));
            expect(JsonPathEvaluator.REG_EXP.test(JSON.stringify(result.schema))).to.be.false;
        });
    });

});
