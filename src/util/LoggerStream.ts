import logger from './logger';
import {StreamOptions} from 'morgan';

export class LoggerStream implements StreamOptions {
    public write(message: string) {
        const morganData: object = JSON.parse(message.trim());
        // @ts-ignore
        logger.info(morganData);
    }
}
