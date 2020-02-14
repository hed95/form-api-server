import {BaseMiddleware} from 'inversify-express-utils';
import * as express from 'express';
import {GrantedRequest} from 'keycloak-connect';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import httpContext from 'express-http-context';
import {User} from '../auth/User';
import _ from 'lodash';
import UnauthorizedError from '../error/UnauthorizedError';

@provide(TYPE.EditMiddleware)
export class EditMiddleware extends BaseMiddleware {
    private editRoles: string[];

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        super();
        this.editRoles = appConfig.edit.roles;
    }

    public handler(req: GrantedRequest, res: express.Response, next: express.NextFunction): void {
        if (this.appConfig.edit.roles.length === 0) {
            next();
        } else {
            const user: User = httpContext.get('user');
            const userRoles: string[] =
                user ? user.details.roles.map((role) => {
                    return role.name;
                }) : req.kauth.grant.access_token.content.realm_access.roles;

            const hasAuthorization: boolean = _.intersectionWith(this.editRoles, userRoles).length >= 1;
            if (hasAuthorization) {
                next()
            } else {
                next(new UnauthorizedError('User not authorized to make edit calls'));
            }
        }
    }

}
