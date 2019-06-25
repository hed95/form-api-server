import logger from './logger';
import {StreamOptions} from 'morgan';

export class LoggerStream implements StreamOptions {
    public write(message: string) {
        const morganData: object = JSON.parse(message.trim());
        // @ts-ignore
        if (morganData.url.endsWith('healthz') || morganData.url.endsWith('readiness')) {
            logger.debug(morganData);
        } else {
            logger.info(morganData);
        }
    }
}
