import FormEvent from './FormEvent';
import logger from '../util/logger';

export default class FormEventListener {

    public onEvent(formEvent: FormEvent): void {
        logger.info(`Event received`, formEvent);
    }
}
