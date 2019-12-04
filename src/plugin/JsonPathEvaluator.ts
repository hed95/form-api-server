import logger from '../util/logger';
import JSONPath from 'jsonpath';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';

@provide(TYPE.JsonPathEvaluator)
export default class JsonPathEvaluator {
    public static REG_EXP: RegExp = new RegExp('\\{(\\$.+?)\\}', 'g');

    public performJsonPathEvaluation({key, value}: Record<string, string>,
                                     dataContext: any, intercept = (parsedValue: string) => {
            return parsedValue;
        }): string {
        if (JsonPathEvaluator.REG_EXP.test(value)) {
            const updatedValue = value.replace(JsonPathEvaluator.REG_EXP, (match, capture) => {
                const val = JSONPath.value(dataContext, capture);
                logger.info(`JSON path \'${capture}\' detected for \'${key}\'` +
                    ` with parsed value \'${(val ? val : 'no match')}\'`);
                return intercept(val);
            });
            return (updatedValue === 'null' || updatedValue === 'undefined') ? null : updatedValue;
        }
        return value;

    }
}
