import {Role} from "./Role";

export class User {
    readonly id: string;
    readonly email: string;
    readonly roles: Role[];

    constructor(id: string, email: string, roles: Role[]) {
        this.id  = id;
        this.email = email;
        this.roles = roles;
    }

}
