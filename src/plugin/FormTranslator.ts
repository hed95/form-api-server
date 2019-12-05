import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import JsonPathEvaluator from './JsonPathEvaluator';
import {FormVersion} from '../model/FormVersion';
import * as util from 'formiojs/utils/formUtils';
import _ from 'lodash';
import logger from '../util/logger';

@provide(TYPE.FormTranslator)
export default class FormTranslator {
    constructor(@inject(TYPE.JsonPathEvaluator) private readonly jsonPathEvaluator: JsonPathEvaluator) {
    }

    public async translate(form: FormVersion,
                           dataContext: any,
                           postProcess?: (passedDataContext: any, schema: any) => Promise<any>): Promise<FormVersion> {
        try {
            form.schema.title = this.jsonPathEvaluator.performJsonPathEvaluation({
                key: 'Form title',
                value: form.schema.title,
            }, dataContext);

            util.eachComponent(form.schema.components, (component: any) => {
                const parsed = this.jsonPathEvaluator.performJsonPathEvaluation({
                    key: component.key,
                    value: JSON.stringify(component),
                }, dataContext);
                form.schema.components = _.reject(form.schema.components, {key: component.key});
                form.schema.components.push(JSON.parse(parsed));
            });
            if (postProcess) {
                form.schema = await postProcess(dataContext, form.schema);
            }
            return form;
        } catch (e) {
            logger.error(`Failed to perform translation`, e);
            return form;
        }
    }
}
