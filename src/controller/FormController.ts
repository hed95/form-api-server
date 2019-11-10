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
    ApiOperationPut,
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
import HttpStatus from 'http-status-codes';
import {CommentService} from '../service/CommentService';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {RestoreData} from '../model/RestoreData';

@ApiPath({
    path: '/form',
    name: 'Forms',
    description: 'API for creating, deleting and finding Forms',
    security: {bearerAuth: []},
})
@controller('/form')
export class FormController extends BaseHttpController {

    private readonly queryParser: QueryParser = new QueryParser();

    constructor(@inject(TYPE.FormService) private readonly formService: FormService,
                @inject(TYPE.ValidationService) private readonly validationService: ValidationService,
                @inject(TYPE.FormResourceAssembler) private readonly formResourceAssembler: FormResourceAssembler,
                @inject(TYPE.CommentService) private readonly commentService: CommentService,
    ) {
        super();
    }

    @ApiOperationGet({
        path: '/{id}',
        description: 'Get latest form schema for a given id',
        summary: 'Get latest form schema for a given id',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    description: 'Form id',
                    type: 'string',
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
                     @principal() currentUser: User,
                     @queryParam() live?: number): Promise<void> {
        const formVersion = await this.formService.findForm(id, currentUser);
        if (!formVersion) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist. Check id or access controls`);
        }
        const form = this.formResourceAssembler.toResource(formVersion, req);
        res.json(form);
    }

    @ApiOperationPost({
        path: '/{id}/submission',
        description: 'Perform a validation of a submission for given form id',
        summary: 'Perform a validation of a submission for given form id',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    description: 'Form id',
                    type: 'string',
                    required: true,
                },
            },
            body: {
                description: 'Submission data',
                type: SwaggerDefinitionConstant.Parameter.Type.OBJECT,
                allowEmptyValue: false,
            },
        },
        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success'},
            400: {description: 'Submission failed validation'},
            404: {description: 'Form does not exist'},
        },
    })
    @httpPost('/:id/submission', TYPE.ProtectMiddleware)
    public async validateSubmission(@requestParam('id') id: string,
                                    @requestBody() submission: object,
                                    @response() res: express.Response,
                                    @principal() currentUser: User): Promise<void> {
        logger.info(`Initiating a submission for validation`);
        const validationErrors: Error[] = await this.validationService.validate(id,
            submission,
            currentUser);
        if (validationErrors.length !== 0) {
            res.status(HttpStatus.BAD_REQUEST).send(validationErrors);
        } else {
            res.status(HttpStatus.OK).send(submission);
        }
    }

    @ApiOperationGet({
        path: '/',
        description: 'Get forms',
        summary: 'Get forms.',
        produces: ['application/json'],
        parameters: {
            query: {
                limit: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    default: 20,
                    description: 'Limit the number of forms returned in response',
                    required: false,
                    name: 'limit',
                },
                offset: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    default: 0,
                    description: 'Page number',
                    required: false,
                    name: 'offset',
                },
                select: {
                    type: SwaggerDefinitionConstant.Parameter.Type.ARRAY,
                    description: 'Specify fields of form schema to be returned. For example \'name\' or \'path\'',
                    required: false,
                    name: 'select',
                },
                filter: {
                    type: SwaggerDefinitionConstant.Parameter.Type.ARRAY,
                    description: 'Comma separated filter. For example \'filter=?name__eq__myForm\'. ',
                    required: false,
                    name: 'filter',
                },
                countOnly: {
                    type: SwaggerDefinitionConstant.Parameter.Type.BOOLEAN,
                    description: 'Use to return count only',
                    required: false,
                    name: 'countOnly',
                },
                name: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Find forms by name',
                    required: false,
                    name: 'name',
                },
                title: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Find forms by title',
                    required: false,
                    name: 'title',
                },
                full: {
                    type: SwaggerDefinitionConstant.Parameter.Type.BOOLEAN,
                    description: 'Load full form schema and any nested forms',
                    required: false,
                    name: 'full',
                }
            },
        },
        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.OBJECT},
        },
    })
    @httpGet('/', TYPE.ProtectMiddleware)
    public async getForms(@queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0,
                          @queryParam('select') attributes: string = null,
                          @queryParam('filter') filter: string = null,
                          @queryParam('countOnly') countOnly: boolean = false,
                          @principal() currentUser: User,
                          @request() req: express.Request,
                          @response() res: express.Response,
                          @queryParam('name') name?: string,
                          @queryParam('title') title?: string,
                          @queryParam('full') full?: boolean): Promise<{ total: number, forms: object[] }> {

        if (full) {
            logger.warn('Nested forms is not currently supported as yet');
        }
        if (name) {
            filter = filter + `,name__eq__${name}`;
        }

        if (title) {
            filter += `,title__iLike__%${title}%`;
        }
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

    @ApiOperationGet({
        path: '/{id}/versions',
        description: 'Get all versions for given form id',
        summary: 'Get all versions for given form id',
        produces: ['application/json'],
        parameters: {
            path: {
                id: {
                    required: true,
                    name: 'id',
                    description: 'Form id',
                    type: 'string',
                },
            },
            query: {
                limit: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    default: 20,
                    description: 'Limit the number of forms returned in response',
                    required: false,
                    name: 'limit',
                },
                offset: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    default: 0,
                    description: 'Page number',
                    required: false,
                    name: 'offset',
                },
            },

        },

        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.OBJECT},
            404: {description: 'Form does not exist'},
        },
    })
    @httpGet('/:id/versions', TYPE.ProtectMiddleware)
    public async allVersions(@requestParam('id') id: string,
                             @queryParam('offset') offset: number = 0,
                             @queryParam('limit') limit: number = 20,
                             @request() req: express.Request,
                             @response() res: express.Response,
                             @principal() currentUser: User,
                             @queryParam('select') select?: string[]): Promise<void> {

        const result: {
            offset: number,
            limit: number,
            versions: FormVersion[],
            total: number,
        } = await this.formService.findAllVersions(id, currentUser, offset, limit, select);
        res.json(result);
    }

    @ApiOperationPut({
        path: '/{id}',
        description: 'Update a form',
        summary: 'Update a form',
        produces: ['application/json'],
        consumes: ['application/json'],
        parameters: {
            path: {
                id: {
                    required: true,
                    name: 'id',
                    description: 'Form id',
                    type: 'string',
                },
            },
            body: {
                type: SwaggerDefinitionConstant.Parameter.Type.OBJECT,
                description: 'Form schema',
            },
        },

        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.OBJECT},
            404: {description: 'Form does not exist'},
            400: {description: 'Invalid for schema'},
        },
    })
    @httpPut('/:id', TYPE.ProtectMiddleware)
    public async update(@requestParam('id') id: string,
                        @requestBody() form: object, @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        const version = await this.formService.update(id, form, currentUser);
        logger.info(`Version id created ${version.versionId}`);
        res.sendStatus(HttpStatus.OK);
    }

    @ApiOperationPut({
        path: '/{id}/roles',
        description: 'Update roles for a given form',
        summary: 'Update roles for a given form',
        produces: ['application/json'],
        consumes: ['application/json'],
        parameters: {
            path: {
                id: {
                    required: true,
                    name: 'id',
                    description: 'Form id',
                    type: 'string',
                },
            },
            body: {
                type: SwaggerDefinitionConstant.Parameter.Type.ARRAY,
                description: 'Roles to apply',
                model: 'Role',
            },
        },

        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.OBJECT},
            404: {description: 'Form does not exist'},
            400: {description: 'Invalid for schema'},
        },
    })
    @httpPut('/:id/roles', TYPE.ProtectMiddleware)
    public async updateRoles(@requestParam('id') id: string,
                             @requestBody() roles: Role[], @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {
        await this.formService.updateRoles(id, roles, currentUser);
        res.status(HttpStatus.OK);
    }

    @ApiOperationPost({
        path: '/',
        description: 'Create a new form',
        summary: 'Create a new form',
        produces: ['application/json'],
        consumes: ['application/json'],
        parameters: {
            body: {
                type: SwaggerDefinitionConstant.Parameter.Type.ARRAY,
                description: 'Form schema',
                required: true,
            },
        },

        responses: {
            403: {description: 'Access denied'},
            201: {description: 'Success'},
            404: {description: 'Form does not exist'},
            400: {description: 'Invalid for schema'},
        },
    })
    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() form: object,
                        @request() req: express.Request,
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        logger.info(`Creating new form`);
        const formVersion = await this.formService.create(currentUser, form);
        res.setHeader('Location', `${req.baseUrl}${req.path}/${formVersion}`);
        res.setHeader('x-form-id', `${formVersion}`);
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
                    type: 'string',
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
        await this.formService.delete(id, currentUser);
        res.status(HttpStatus.OK);
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
                    type: 'string',
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
                          @queryParam('limit') limit: number = 20,
                          @queryParam('offset') offset: number = 0,
                          @response() res: express.Response,
                          @principal() currentUser: User): Promise<void> {
        const comments: { total: number, comments: FormComment[] } =
            await this.commentService.comments(id, currentUser, offset, limit);
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
                    type: 'string',
                    required: true,
                },
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
        const formCreated: FormComment = await this.commentService.createComment(id, currentUser, comment);
        res.json(formCreated).status(HttpStatus.CREATED);

    }

    @ApiOperationGet({
        path: '/version/{versionId}',
        description: 'Get a specific form version',
        summary: 'Get all comments for a given form',
        parameters: {
            path: {
                id: {
                    name: 'versionId',
                    description: 'Version id',
                    type: 'string',
                    required: true,
                },
            },
        },
        responses: {
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.OBJECT},
            404: {description: 'Form does not exist'},
            500: {description: 'Internal execution error'},
        },
    })
    @httpGet('/version/:versionId', TYPE.ProtectMiddleware)
    public async getByVersionId(@requestParam('versionId') versionId: string,
                                @request() req: express.Request,
                                @response() res: express.Response,
                                @principal() currentUser: User): Promise<void> {

        const formVersion: FormVersion = await this.formService.findByVersionId(versionId, currentUser);
        res.json(formVersion);
    }

    @httpGet('/:formId/v/:versionId', TYPE.ProtectMiddleware)
    public async getVersionByFormIdAndVersion(@requestParam('versionId') versionId: string,
                                              @requestParam('formId') formId: string,
                                              @request() req: express.Request,
                                              @response() res: express.Response,
                                              @principal() currentUser: User): Promise<void> {
        const formVersion: FormVersion = await this.formService.findByFormAndVersion(formId, versionId, currentUser);
        res.json(this.formResourceAssembler.toResource(formVersion, req));
    }

    @ApiOperationPost({
        path: '/restore',
        description: 'Restore a specific form version to latest',
        summary: 'Restore a specific form version to latest',
        parameters: {
            body: {
                description: 'Data that contains the form id and the version that needs to be made latest',
                properties: {
                    formId: {
                        type: 'string',
                        required: true,
                    },
                    versionId: {
                        type: 'string',
                        required: true,
                    },
                },
            },
        },
        responses: {
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.OBJECT},
            404: {description: 'Form does not exist'},
            500: {description: 'Internal execution error'},
        },
    })
    @httpPost('/restore', TYPE.ProtectMiddleware)
    public async restore(@requestBody() restoreData: RestoreData,
                         @request() req: express.Request,
                         @response() res: express.Response,
                         @principal() currentUser: User): Promise<void> {
        const versionId = restoreData.versionId;
        const formId = restoreData.formId;
        const version = await this.formService.restore(formId, versionId, currentUser);
        res.json(this.formResourceAssembler.toResource(version, req));
    }
}
