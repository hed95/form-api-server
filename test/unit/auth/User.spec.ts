import 'reflect-metadata';
import {expect} from "chai";
import {User} from "../../../src/auth/User";
import {Role} from "../../../src/model/Role";

describe('User', () => {
    Object.assign(Role, {});
    const role: Role = Object.assign(Role.prototype, {});
    role.name = 'test';
    role.id = 'test';
    const user = new User("email", "email", [role]);

    it('isAuthenticated', async () => {
        const result = await user.isAuthenticated();
        expect(result).to.be.eq(true);
    });

    it('isInRole', async() => {
        const result = await user.isInRole('test');
        expect(result).to.be.eq(true);
    });
    it('isNotInRole', async() => {
        const result = await user.isInRole('x');
        expect(result).to.be.eq(false);
    });
    it('isResourceOwner', async() => {
        const result = await user.isResourceOwner('test');
        expect(result).to.be.undefined;
    })
});
