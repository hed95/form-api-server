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
    request,
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
import {FormComment} from '../model/FormComment';
import {FormVersion} from '../model/FormVersion';
import {Role} from '../model/Role';
import {FormService} from '../service/FormService';
import {QueryParser} from '../util/QueryParser';
import {ValidationService} from '../service/ValidationService';
import {FormResourceAssembler} from './FormResourceAssembler';
import logger from '../util/logger';
import _ from 'lodash';
import {ValidationError} from '@hapi/joi';
import InternalServerError from '../error/InternalServerError';
import HttpStatus from 'http-status-codes';

@ApiPath({
    path: '/forms',
    name: 'Forms',
    security: {bearerAuth: []},
})
@controller('/forms')
export class FormController extends BaseHttpController {

    private readonly queryParser: QueryParser = new QueryParser();

    constructor(@inject(TYPE.FormService) private readonly formService: FormService,
                @inject(TYPE.ValidationService) private readonly validationService: ValidationService,
                @inject(TYPE.FormResourceAssembler) private readonly formResourceAssembler: FormResourceAssembler,
    ) {
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
                     @request() req: express.Request,
                     @response() res: express.Response,
                     @principal() currentUser: User): Promise<void> {
        const formVersion = await this.formService.findForm(id, currentUser);
        const form = this.formResourceAssembler.toResource(formVersion, req);
        res.json(form);
    }

    @httpPost('/:id/validate', TYPE.ProtectMiddleware)
    public async validateSubmission(@requestParam('id') id: string,
                                    @requestBody() submission: object,
                                    @response() res: express.Response,
                                    @principal() currentUser: User): Promise<void> {
        logger.info(`Initiating a submission for validation ${JSON.stringify(submission)}`);
        const validationErrors: ValidationError[] = await this.validationService.validate(id,
            submission,
            currentUser);
        if (validationErrors.length !== 0) {
            res.status(HttpStatus.BAD_REQUEST).send(validationErrors);
        } else {
            res.sendStatus(HttpStatus.OK);
        }
    }

    @httpGet('/', TYPE.ProtectMiddleware)
    public async getForms(@queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0,
                          @queryParam('select') attributes: string = null,
                          @queryParam('filter') filter: string = null,
                          @queryParam('countOnly') countOnly: boolean = false,
                          @principal() currentUser: User,
                          @request() req: express.Request,
                          @response() res: express.Response): Promise<{ total: number, forms: object[] }> {

        const filterQuery: object = filter && filter.split(',').length !== 0 ?
            this.queryParser.parse(filter.split(',')) : null;

        const fieldAttributes: string[] = attributes ? attributes.split(',') : [];

        const result: { total: number, forms: FormVersion[] } = await
            this.formService.getAllForms(currentUser,
                limit,
                offset,
                filterQuery,
                fieldAttributes, countOnly);
        const forms: { total: number, forms: object[] } = {
            total: 0,
            forms: [],
        };
        if (result.total !== 0) {
            forms.total = result.total;
            forms.forms = _.map(result.forms, (form: FormVersion) => {
                return this.formResourceAssembler.toResource(form, req);
            });
        }
        return forms;

    }

    @httpGet('/:id/versions', TYPE.ProtectMiddleware)
    public async allVersions(@requestParam('id') id: string,
                             @queryParam('offset') offset: number = 0,
                             @queryParam('limit') limit: number = 20,
                             @request() req: express.Request,
                             @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {

        const result: {
            offset: number,
            limit: number,
            versions: FormVersion[],
            total: number,
        } = await this.formService.findAllVersions(id, offset, limit, currentUser);

        res.json({
            offset: result.offset,
            limit: result.limit,
            total: result.total,
            versions: _.map(result.versions, (version: FormVersion) => {
                return this.formResourceAssembler.toResource(version, req, true);
            }),
        });
    }

    @httpPut('/:id', TYPE.ProtectMiddleware)
    public async update(@requestParam('id') id: string,
                        @requestBody() form: object, @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {

        await this.formService.update(id, form, currentUser);
        res.sendStatus(HttpStatus.OK);
    }

    @httpPut('/:id/roles', TYPE.ProtectMiddleware)
    public async updateRoles(@requestParam('id') id: string,
                             @requestBody() roles: Role[], @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {
        await this.formService.updateRoles(id, roles, currentUser);
        res.status(HttpStatus.OK);
    }

    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() form: object,
                        @request() req: express.Request,
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        logger.info(`Creating new form`);
        const formVersion = await this.formService.create(currentUser, form);
        res.setHeader('Location', `${req.baseUrl}${req.path}/${formVersion}`);
        res.sendStatus(HttpStatus.CREATED);
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
    public async delete(@requestParam('id') id: string,
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        logger.info(`Deleting form with id ${id}`);
        const deleted = await this.formService.delete(id, currentUser);
        if (deleted) {
            res.status(HttpStatus.OK);
        }
        throw new InternalServerError(`Failed to delete form with id ${id}`);
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
        const comments: FormComment[] = await this.formService.getComments(id, currentUser);
        res.json(comments);
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

        await this.formService.createComment(id, currentUser, comment);
        res.sendStatus(HttpStatus.CREATED);

    }

    @httpGet('/version/:versionId', TYPE.ProtectMiddleware)
    public async getByVersionId(@requestParam('id') id: string,
                                @request() req: express.Request,
                                @response() res: express.Response,
                                @principal() currentUser: User): Promise<void> {

        const formVersion: FormVersion = await this.formService.findByVersionId(id, currentUser);
        const toReturn = this.formResourceAssembler.toResource(formVersion, req);
        res.json(toReturn);
    }
}
