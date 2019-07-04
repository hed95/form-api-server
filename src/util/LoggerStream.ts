import logger from './logger';
import {StreamOptions} from 'morgan';

export class LoggerStream implements StreamOptions {
    public write(message: string) {
        const morganData: any = JSON.parse(message.trim());
        if (morganData.url.endsWith('healthz')
            || morganData.url.endsWith('readiness')
            || morganData.method === 'OPTIONS') {
            logger.debug(morganData);
        } else {
            logger.info(morganData);
        }
    }
}
