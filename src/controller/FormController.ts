import * as express from 'express';
import {inject} from 'inversify';
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
    response,
} from 'inversify-express-utils';
import {
    ApiOperationDelete,
    ApiOperationGet,
    ApiOperationPost,
    ApiPath,
    SwaggerDefinitionConstant,
} from 'swagger-express-ts';
import {User} from '../auth/User';
import TYPE from '../constant/TYPE';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import ValidationError from '../error/ValidationError';
import {FormComment} from '../model/FormComment';
import {FormVersion} from '../model/FormVersion';
import {Role} from '../model/Role';
import {FormService} from '../service/FormService';
import logger from '../util/logger';
import {QueryParser} from '../util/QueryParser';
import Validator from 'validator';

@ApiPath({
    path: '/forms',
    name: 'Forms',
    security: {bearerAuth: []},
})
@controller('/forms')
export class FormController extends BaseHttpController {

    private readonly queryParser: QueryParser = new QueryParser();

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {
        super();
    }

    @ApiOperationGet({
        path: '/{id}',
        description: 'Get a form schema for a given id',
        summary: 'Get a form schema for a given id',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    description: 'Form id',
                    format: 'string',
                    required: true,
                },
            },
        },
        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success'},
            404: {description: 'Form does not exist'},
        },
    })
    @httpGet('/:id', TYPE.ProtectMiddleware)
    public async get(@requestParam('id') id: string,
                     @response() res: express.Response,
                     @principal() currentUser: User): Promise<void> {
        const isUUID: boolean = Validator.isUUID(id);

        if (!isUUID) {
            res.status(400).json({
                id,
                exception: 'Not valid UUID',
                resource: 'Form',
            });
        } else {
            const formVersion = await this.formService.findForm(id, currentUser);
            if (!formVersion) {
                res.status(404).send({
                    id,
                    exception: 'Resource not found',
                    resource: 'Form',
                });
            } else {
                res.json(formVersion.schema);
            }
        }
    }

    @httpPost('/:id/submission', TYPE.ProtectMiddleware)
    public async validateSubmission(@requestParam('id') id: string,
                                    @requestBody() form: object,
                                    @response() res: express.Response,
                                    @principal() currentUser: User): Promise<void> {
        logger.info(`Initiating a submission for validation`);
    }

    @httpGet('/', TYPE.ProtectMiddleware)
    public async getForms(@queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0,
                          @queryParam('select') attributes: string[] = [],
                          @queryParam('filter') filter: string[] = [],
                          @principal() currentUser: User,
                          @response() res: express.Response): Promise<{ total: number, forms: FormVersion[] }> {

        try {
            const filterQuery: object = filter.length !== 0 ? this.queryParser.parse(filter) : null;
            return await
                this.formService.getAllForms(currentUser, limit, offset, filterQuery, attributes);
        } catch (e) {
            if (e instanceof ValidationError) {
                const validationError = e as ValidationError;
                res.status(400);
                res.json({
                    exception: validationError.get(),
                });
            } else {
                res.status(500);
                res.json({
                    exception: e.toString(),
                });
            }
        }

    }

    @httpGet('/:id/versions', TYPE.ProtectMiddleware)
    public async allVersions(@requestParam('id') id: string,
                             @queryParam('offset') offset: number = 0,
                             @queryParam('limit') limit: number = 20,
                             @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {

        try {
            const result: {
                offset: number,
                limit: number,
                versions: FormVersion[],
                total: number,
            } = await this.formService.findAllVersions(id, offset, limit, currentUser);
            res.json(result);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404).send({
                    id,
                    exception: 'Resource not found',
                    resource: 'Form',
                });
            } else {
                res.status(500).send({
                    exception: e.toString(),
                });
            }
        }
    }

    @httpPut('/:id', TYPE.ProtectMiddleware)
    public async update(@requestParam('id') id: string,
                        @requestBody() form: object, @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {

        try {
            await this.formService.update(id, form, currentUser);
            res.sendStatus(200);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404);
                res.json({
                    message: `For with id: ${id} does not exist`,
                });
            } else if (e instanceof ValidationError) {
                const validationError = e as ValidationError;
                res.status(400);
                res.json({
                    exception: validationError.get(),
                });
            } else {
                res.status(500);
                res.json({
                    exception: e.toString(),
                });
            }
        }
    }

    @httpPut('/:id/roles', TYPE.ProtectMiddleware)
    public async updateRoles(@requestParam('id') id: string,
                             @requestBody() roles: Role[], @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {
        try {
            await this.formService.updateRoles(id, roles, currentUser);
            res.status(200);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404);
                res.json({
                    message: `For with id: ${id} does not exist`,
                });
            } else {
                res.status(500);
                res.json({
                    exception: e.toString(),
                });
            }
        }
    }

    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() form: object,
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        logger.info(`Creating new form`);
        try {

            const formVersion = await this.formService.create(currentUser, form);
            res.setHeader('Location', `/form/${formVersion.form.id}`);
            res.sendStatus(201);
        } catch (err) {
            if (err instanceof ValidationError) {
                const validationError = err as ValidationError;
                res.status(400);
                res.json({
                    exception: validationError.get(),
                });
            } else {
                res.status(500);
                res.json({
                    exception: err.toString(),
                });
            }

        }
    }

    @ApiOperationDelete({
        path: '/{id}',
        description: 'Delete a form',
        summary: 'Updates the validTo attribute of the latest version, effectively marking it as deleted. ' +
            'Subsequent calls using the GET method will not return the form. ' +
            'You can use the findAllVersions call and restore',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    description: 'Form id',
                    format: 'string',
                    required: true,
                },
            },
        },
        responses: {
            200: {description: 'Success'},
            404: {description: 'Form does not exist'},
            500: {description: 'Internal execution error'},
        },
    })
    @httpDelete('/:id', TYPE.ProtectMiddleware)
    public async delete(@requestParam('id') id: string, @principal() currentUser: User): Promise<void> {
        logger.info(`Deleting form with id ${id}`);
        await this.formService.delete(id, currentUser);
    }

    @ApiOperationGet({
        path: '/{id}/comments',
        description: 'Get all comments for a given form',
        summary: 'Get all comments for a given form',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    description: 'Form id',
                    format: 'string',
                    required: true,
                },
            },
        },
        responses: {
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.ARRAY, model: 'FormComment'},
            404: {description: 'Form does not exist'},
            500: {description: 'Internal execution error'},
        },
    })
    @httpGet('/:id/comments', TYPE.ProtectMiddleware)
    public async comments(@requestParam('id') id: string,
                          @response() res: express.Response,
                          @principal() currentUser: User): Promise<void> {
        try {
            const comments: FormComment[] = await this.formService.getComments(id, currentUser);
            res.json(comments);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404).send({
                    id,
                    exception: 'Resource not found',
                    resource: 'Form',
                });
            } else {
                res.status(500).json(e.toString());
            }
        }
    }

    @ApiOperationPost({
        path: '/{id}/comments',
        description: 'Create a comment for a form',
        summary: 'Create a comment for a form',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    description: 'Form id',
                    format: 'string',
                    required: true,
                },
            },
            body: {
                type: SwaggerDefinitionConstant.Response.Type.OBJECT, model: 'FormComment',
            },
        },
        responses: {
            201: {description: 'Comment successfully created for form'},
            404: {description: 'Form does not exist'},
            500: {description: 'Internal execution error'},
        },
    })
    @httpPost('/:id/comments', TYPE.ProtectMiddleware)
    public async createComment(@requestParam('id') id: string,
                               @requestBody() comment: FormComment,
                               @response() res: express.Response,
                               @principal() currentUser: User): Promise<void> {

        try {
            await this.formService.createComment(id, currentUser, comment);
            res.sendStatus(201);
        } catch (e) {
            if (e instanceof ResourceNotFoundError) {
                res.status(404).send({
                    id,
                    exception: 'Resource not found',
                    resource: 'Form',
                });
            } else {
                res.status(500).json(e.toString());
            }
        }

    }

}
