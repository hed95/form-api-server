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
import _ = require('lodash');

describe('Form Translator ', () => {
    const jsonPathEvaluator = new JsonPathEvaluator();
    const formTranslator = new FormTranslator(jsonPathEvaluator);
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
    const dataContext: Record<any, any> = {
        processContext: {
            businessKey: 'businessKey',
            variable: {
                firstName: 'Joe',
                surname: 'Bloggs',
            },
        },
    };
    Object.assign(FormVersion, {});
    // @ts-ignore
    const version: FormVersion = {...FormVersion.prototype};

    afterEach(() => {
        version.schema = null;
    });

    it('can parse expression', () => {
        version.schema = form;
        const result = formTranslator.translate(version, dataContext);
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
        it(`it can parse ${formToTest.name}`, () => {
            version.schema = formToTest;
            const result = formTranslator.translate(version, {
                environmentContext: {
                    referenceDataUrl: 'http://localhost:8000',
                },
                processContext: {
                    person: {
                        id: 'id',
                        firstName: 'Joe',
                        lastName: 'Bloggs',
                    },
                },
                keycloakContext: {
                    givenName: 'apples',
                    familyName: 'test',
                    sessionId: 'sessionId1234',
                },
            });
            expect(JsonPathEvaluator.REG_EXP.test(JSON.stringify(result.schema))).to.be.false;
        });
    });

    const componentValue = (components, componentKey) => {
        return _.find(components, {key: componentKey}).defaultValue;
    };
});
