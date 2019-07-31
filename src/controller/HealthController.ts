import * as express from 'express';
import {BaseHttpController, controller, httpGet, response} from 'inversify-express-utils';
import {inject} from 'inversify';
import TYPE from '../constant/TYPE';
import {SequelizeProvider} from '../model/SequelizeProvider';
import logger from '../util/logger';
import HttpStatus from 'http-status-codes';

@controller('')
export class HealthController extends BaseHttpController {

    constructor( @inject(TYPE.SequelizeProvider) private readonly sequelizeProvider: SequelizeProvider) {
        super();
    }

    @httpGet('/healthz')
    public health(@response() res: express.Response): void {
        res.json({uptime: process.uptime()});
    }

    @httpGet('/readiness')
    public async readiness(@response() res: express.Response): Promise<void> {
        try {
            await this.sequelizeProvider.getSequelize().authenticate();
            logger.debug('Connection has been established successfully.');
            res.status(HttpStatus.OK).json({
                status: 'READY',
            });
        } catch (err) {
            logger.error('Unable to connect to the database', {
                exception: err.message,
            });
            res.sendStatus(HttpStatus.BAD_GATEWAY);
        }
    }
}
