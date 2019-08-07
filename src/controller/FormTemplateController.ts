import {ApiPath} from "swagger-express-ts";
import {controller} from "inversify-express-utils";

@ApiPath({
    path: '/templates',
    name: 'Template',
    description: 'Api for returning form rendering template',
    security: {bearerAuth: []},
})
@controller('/templates')
export class FormTemplateController {

}
