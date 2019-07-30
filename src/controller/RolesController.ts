import {inject} from 'inversify';
import {
    BaseHttpController,
    controller,
    httpGet,
    httpPost,
    principal,
    queryParam,
    requestBody,
    response,
} from 'inversify-express-utils';
import TYPE from '../constant/TYPE';
import {Role} from '../model/Role';
import logger from '../util/logger';
import {User} from '../auth/User';
import * as express from 'express';
import {RoleService} from '../service/RoleService';
import HttpStatus from 'http-status-codes';
import {ApiOperationGet, ApiOperationPost, ApiPath, SwaggerDefinitionConstant} from 'swagger-express-ts';

@ApiPath({
    path: '/roles',
    name: 'Role',
    description: 'API for finding and creating Roles',
    security: {bearerAuth: []},
})
@controller('/roles')
export class RolesController extends BaseHttpController {

    constructor(@inject(TYPE.RoleService) private readonly roleService: RoleService) {
        super();
    }

    @ApiOperationGet({
        description: 'Get all roles within API Server',
        summary: 'Get all roles within API Server',
        parameters: {
            query: {
                limit: {
                    description: 'Limit the number of roles returned on GET',
                    default: 20,
                    type: 'number',
                },
                offset: {
                    description: 'Page number',
                    default: 0,
                    type: 'number',
                },
            },
        },
        responses: {
            403: {description: 'Access denied'},
            200: {description: 'Success', type: SwaggerDefinitionConstant.Response.Type.ARRAY, model: 'Role'},

        },
    })
    @httpGet('/', TYPE.ProtectMiddleware)
    public async roles(@queryParam('limit') limit: number = 20, @queryParam('offset') offset: number = 0):
        Promise<{ total: number, roles: Role[] }> {
        const profiler = logger.startTimer();
        const result: { rows: Role[], count: number } = await this.roleService.roles(limit, offset);
        profiler.done({message: 'roles returned'});
        return {
            total: result.count,
            roles: result.rows,
        };
    }

    @ApiOperationPost({
        description: 'Create new roles in API Server',
        summary: 'Create new roles in API Server',
        parameters: {
            body: {
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                    },
                    description: {
                        type: 'string',
                        required: false,
                    },
                },
            },
        },
        responses: {
            403: {description: 'Access denied'},
            201: {description: 'Success'},
        },
    })
    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() roles: Array<{ name: string, description: string }>,
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        logger.info(`Adding new roles`);
        await this.roleService.createRoles(roles, currentUser);
        res.sendStatus(HttpStatus.CREATED);
    }
}
