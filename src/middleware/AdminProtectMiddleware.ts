import {BaseMiddleware} from 'inversify-express-utils';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import * as express from 'express';
import UnauthorizedError from '../error/UnauthorizedError';
import _ from 'lodash';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import {GrantedRequest} from 'keycloak-connect';

@provide(TYPE.AdminProtectMiddleware)
export class AdminProtectMiddleware extends BaseMiddleware {

    public adminRoles: string[];

    constructor(@inject(TYPE.AppConfig) appConfig: AppConfig) {
        super();
        this.adminRoles = appConfig.admin.roles;
    }

    public handler(req: GrantedRequest, res: express.Response, next: express.NextFunction): void {
        const roles: string[] = req.kauth.grant.access_token.content.realm_access.roles;
        const hasAuthorization: boolean = _.intersectionWith(this.adminRoles, roles).length >= 1;
        if (!hasAuthorization) {
            next(new UnauthorizedError('User not authorized to make admin call'));
        } else {
            next();
        }

    }
}
