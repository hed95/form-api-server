import {
    BaseHttpController,
    controller,
    httpGet,
    httpPost,
    httpPut,
    principal,
    queryParam,
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
import ResourceNotFoundError from "../error/ResourceNotFoundError";
import {FormVersion} from "../model/FormVersion";


@controller("/form")
export class FormController extends BaseHttpController {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {
        super();
    }

    @httpGet('/:id', TYPE.ProtectMiddleware)
    public async get(@requestParam("id") id: string,
                     @response() res: express.Response,
                     @principal() currentUser: User): Promise<void> {
        const formVersion = await this.formService.findForm(id, currentUser);
        if (!formVersion) {
            res.status(404).send({});
        } else {
            res.json(formVersion.schema);
        }
    }

    @httpGet('/:id/versions', TYPE.ProtectMiddleware)
    public async allVersions(@requestParam("id") id: string,
                             @queryParam("offset") offset: number = 0,
                             @queryParam("limit") limit: number = 20,
                             @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {

        try {
            const result: {
                offset: number,
                limit: number,
                versions: FormVersion[],
                total: number
            } = await this.formService.findAllVersions(id, offset, limit, currentUser);
            res.json(result);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404).send({})
            } else {
                res.status(500).send({
                    message: e.toString()
                })
            }

        }

    }

    @httpPut('/:id', TYPE.ProtectMiddleware)
    public async update(@requestParam("id") id: string,
                        @requestBody() form: any, @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {

        try {
            await this.formService.update(id, form, currentUser);
            res.sendStatus(200);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404);
                res.json({
                    message: `For with id: ${id} does not exist`
                })
            }
            if (e instanceof ValidationError) {
                const validationError = e as ValidationError;
                res.status(400);
                res.json({
                    errors: validationError.get()
                })
            } else {
                res.status(500);
                res.json({
                    message: e.toString()
                });
            }
        }
    }

    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() form: any,
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
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
