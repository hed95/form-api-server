import * as express from 'express';
import {BaseHttpController, controller, httpGet, response} from 'inversify-express-utils';

@controller('')
export class HealthController extends BaseHttpController {

    @httpGet('/healthz')
    public health(@response() res: express.Response): void {
        res.json({uptime: process.uptime()});
    }

    @httpGet('/readiness')
    public readiness(@response() res: express.Response): void {
        res.json({status: 'READY'});
    }
}
