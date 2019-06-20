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
import {RoleService} from "../service/RoleService";
import ValidationError from "../error/ValidationError";

@controller('/roles')
export class RolesController extends BaseHttpController {

    constructor(@inject(TYPE.RoleService) private readonly roleService: RoleService) {
        super();
    }

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

    @httpPost('/', TYPE.ProtectMiddleware)
    public async create(@requestBody() roles: { name: string, description: string }[],
                        @response() res: express.Response,
                        @principal() currentUser: User): Promise<void> {
        logger.info(`Adding new roles`);
        try {
            await this.roleService.createRoles(roles, currentUser);
            res.sendStatus(201);
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
}
