import * as express from 'express';
import {inject} from 'inversify';
import {BaseHttpController, controller, httpGet, queryParam, request, response} from 'inversify-express-utils';
import TYPE from '../constant/TYPE';
import {FormService} from '../service/FormService';
import {FormVersion} from '../model/FormVersion';

@controller('/admin')
export class AdminController extends BaseHttpController {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {
        super();
    }

    @httpGet('/forms', TYPE.ProtectMiddleware, TYPE.AdminProtectMiddleware)
    public async allForms(@request() req: express.Request,
                          @response() res: express.Response,
                          @queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0): Promise<void> {

        const result: { total: number, versions: FormVersion[] } = await this.formService.allForms(limit, offset);
        res.json(result);
    }
}
