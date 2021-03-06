import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import JsonPathEvaluator from './JsonPathEvaluator';
import {FormVersion} from '../model/FormVersion';
import * as util from 'formiojs/utils/formUtils';
import _ from 'lodash';
import logger from '../util/logger';
import PromiseTimeoutHandler from './PromiseTimeoutHandler';
import DataContextPluginRegistry from './DataContextPluginRegistry';
import KeycloakContext from './KeycloakContext';
import ProcessPointers from './ProcessPointers';

@provide(TYPE.FormTranslator)
export default class FormTranslator {
    constructor(@inject(TYPE.JsonPathEvaluator) private readonly jsonPathEvaluator: JsonPathEvaluator,
                @inject(TYPE.PromiseTimeoutHandler) private readonly promiseTimeoutHandler: PromiseTimeoutHandler,
                @inject(TYPE.DataContextPluginRegistry) private readonly dataContextPluginRegistry:
                    DataContextPluginRegistry) {
    }

    public async translate(form: FormVersion,
                           keycloakContext: KeycloakContext,
                           processPointers: ProcessPointers = {}): Promise<FormVersion> {

        if (!this.dataContextPluginRegistry.getPlugin()) {
            return form;
        }

        const dataContext = await this.dataContextPluginRegistry.getDataContext(keycloakContext,
            processPointers.processInstanceId, processPointers.taskId);
        if (!dataContext) {
            logger.info('No data context found...so returning original form');
            return form;
        }
        logger.info('Data context', dataContext);
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
            try {
                if (this.dataContextPluginRegistry.postProcess
                    && typeof this.dataContextPluginRegistry.postProcess === 'function') {
                    form.schema = await this.promiseTimeoutHandler.timeoutPromise('postProcess',
                        this.dataContextPluginRegistry.postProcess(dataContext, form.schema),
                        () => {
                            return form.schema;
                        });
                }
            } catch (e) {
                logger.error(e.message);
            }
            return form;
        } catch (e) {
            logger.error(`Failed to perform translation`, e);
            return form;
        }
    }
}
