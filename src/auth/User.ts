import {interfaces} from 'inversify-express-utils';
import _ from 'lodash';
import {Role} from '../model/Role';

export class User implements interfaces.Principal {
    public details: { id: string, email: string, roles: Role[] };

    constructor(id: string, email: string, roles: Role[] = []) {
        this.details = {
            id,
            email,
            roles,
        };
    }

    public isAuthenticated(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public isInRole(roleId: string): Promise<boolean> {
        const found = _.find(this.details.roles, (role: Role) => role.id === roleId);
        return Promise.resolve(!_.isNull(found) && !_.isUndefined(found));
    }

    public isResourceOwner(resourceId: string): Promise<boolean> {
        return undefined;
    }

}
