import {BaseHttpController, controller, httpGet, response} from 'inversify-express-utils';
import * as express from 'express';

@controller("")
export class HealthController extends BaseHttpController{

    @httpGet('/healthz')
    public health(@response() res: express.Response) : void {
        res.json({uptime: process.uptime()});
    }

    @httpGet('/readiness')
    public readiness(): String {
        return "READY"
    }
}
