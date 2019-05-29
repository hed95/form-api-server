import {Role} from "./Role";

export class User {
    private readonly id: string;
    private readonly email: string;
    private readonly roles: Role[];

    constructor(id: string, email: string, roles: Role[]) {
        this.id  = id;
        this.email = email;
        this.roles = roles;
    }

    public getRoles() : Role[] {
        return this.roles;
    }

    public getId(): string {
        return this.id;
    }

    public getEmail(): string {
        return this.email;
    }

}
