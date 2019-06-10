import {
    BaseHttpController,
    controller,
    httpDelete,
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
import {FormComment} from "../model/FormComment";
import {ApiOperationGet, ApiPath} from "swagger-express-ts";


@ApiPath({
    path: "/forms",
    name: "Forms",
    security: { bearerAuth: [] }
})
@controller("/forms")
export class FormController extends BaseHttpController {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {
        super();
    }

    @ApiOperationGet({
        path: "/{id}",
        description: "Get a form schema for a given id",
        summary: "Get a form schema for a given id",
        parameters: {
            path: {
                "id" : {
                    name: "id",
                    description: "Form id",
                    format: "string",
                    required: true
                }
            }
        },
        responses: {
            200: { description: "Success" },
            404: { description: "Form does not exist" }
        }
    })
    @httpGet('/:id', TYPE.ProtectMiddleware)
    public async get(@requestParam("id") id: string,
                     @response() res: express.Response,
                     @principal() currentUser: User): Promise<void> {
        const formVersion = await this.formService.findForm(id, currentUser);
        if (!formVersion) {
            res.status(404).send({
                "id": id,
                "exception" : "Resource not found",
                "resource": "Form"
            });
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
                res.status(404).send({
                    "id": id,
                    "exception" : "Resource not found",
                    "resource": "Form"
                });
            } else {
                res.status(500).send({
                    exception: e.toString()
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
                    exception: validationError.get()
                })
            } else {
                res.status(500);
                res.json({
                    exception: e.toString()
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
                    exception: validationError.get()
                })
            } else {
                res.status(500);
                res.json({
                    exception: err.toString()
                });
            }

        }
    }

    @httpDelete("/:id", TYPE.ProtectMiddleware)
    public async delete(@requestParam("id") id: string, @principal() currentUser: User): Promise<void> {
        logger.info(`Deleting form with id ${id}`);
        await this.formService.delete(id, currentUser);
    }

    @httpGet('/:id/comments', TYPE.ProtectMiddleware)
    public async comments(@requestParam("id") id: string,
                          @response() res: express.Response,
                          @principal() currentUser: User): Promise<void> {
        try {
            const comments: FormComment[] = await this.formService.getComments(id, currentUser);
            res.json(comments);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404).send({
                    "id": id,
                    "exception" : "Resource not found",
                    "resource": "Form"
                });
            } else {
                res.status(500).json(e.toString());
            }
        }
    }

    @httpPost("/:id/comments", TYPE.ProtectMiddleware)
    public async createComment(@requestParam("id") id: string,
                               @requestBody() comment: any,
                               @response() res: express.Response,
                               @principal() currentUser: User): Promise<void> {

        try {
            const created: FormComment = await this.formService.createComment(id, currentUser, comment.message);
            res.json(created);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404).send({
                    "id": id,
                    "exception" : "Resource not found",
                    "resource": "Form"
                });
            } else {
                res.status(500).json(e.toString());
            }
        }

    }
}
