import {
    BaseHttpController,
    controller,
    httpGet,
    httpPost,
    principal,
    request,
    requestBody,
    requestParam,
    response
} from "inversify-express-utils";
import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {FormService} from "../service/FormService";
import * as express from 'express';
import logger from "../util/logger";
import {User} from "../auth/User";
import ValidationError from "../error/ValidationError";


@controller("/form")
export class FormController extends BaseHttpController {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {
        super();
    }

    @httpGet('/:id', TYPE.ProtectMiddleware)
    public async get(@requestParam("id") id: string, @request() req: express.Request, @response() res: express.Response, @principal() currentUser: User): Promise<void> {
        const formVersion = await this.formService.findForm(id, currentUser);
        if (!formVersion) {
            res.status(404).send({});
        } else {
            res.json(formVersion.schema);
        }

    }

    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() form: any, @response() res: express.Response, @principal() currentUser: User): Promise<void> {
        logger.info(`Creating new form`);
        try {

            const formVersion = await this.formService.create(currentUser, form);
            res.status(201);
            res.location(`/form/${formVersion.form.id}`);
        } catch (err) {
            if (err instanceof ValidationError) {
                const validationError = err as ValidationError;
                res.status(400);
                res.json({
                    errors: validationError.get()
                })
            } else {
                res.status(500);
                res.json({
                    message: err.toString()
                });
            }

        }
    }
}
