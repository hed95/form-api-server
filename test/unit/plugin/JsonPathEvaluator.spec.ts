import 'reflect-metadata';
import JsonPathEvaluator from '../../../src/plugin/JsonPathEvaluator';
// tslint:disable-next-line:no-implicit-dependencies
import {expect} from 'chai';

describe('Json Path Evaluator', () => {
    const jsonPathEvaluator = new JsonPathEvaluator();
    const dataContext: Record<any, any> = {
        processContext: {
            variable: {
                firstName: 'Joe',
                surname: 'Bloggs',
            },
        },
    };

    it('can parse expression', () => {
        const result = jsonPathEvaluator.performJsonPathEvaluation({
            key: 'test',
            value: '{$.processContext.variable.firstName} {$.processContext.variable.surname} is not here',
        }, dataContext);
        expect(result).to.be.eq('Joe Bloggs is not here');
    });

});
