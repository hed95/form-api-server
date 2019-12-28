import {BaseHttpController, controller} from 'inversify-express-utils';
import {ApiPath} from 'swagger-express-ts';

@ApiPath({
    path: '/reports',
    name: 'Reports',
    description: 'API for getting form reports',
    security: {bearerAuth: []},
})
@controller('/reports')
export default class ReportsController extends BaseHttpController {

}
