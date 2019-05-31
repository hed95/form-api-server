import {Role} from "../model/Role";
import {interfaces} from "inversify-express-utils";
import _ from 'lodash';

export class User implements interfaces.Principal {
    details: any;

    constructor(id: string, email: string, roles: Role[] = []) {
        this.details = {
            id: id,
            email: email,
            roles: roles
        };
    }

    isAuthenticated(): Promise<boolean> {
        return Promise.resolve(true);
    }

    isInRole(role: string): Promise<boolean> {
        const found = _.find(this.details.roles, (role) => role.id === role);
        return Promise.resolve(_.isNull(found));
    }

    isResourceOwner(resourceId: any): Promise<boolean> {
        return undefined;
    }

}
