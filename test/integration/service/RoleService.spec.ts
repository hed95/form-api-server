import {expect} from 'chai';
import {applicationContext} from "../setup-test";
import TYPE from "../../../src/constant/TYPE";
import {RoleService} from "../../../src/service/RoleService";
import {User} from "../../../src/auth/User";
import {Role} from "../../../src/model/Role";
import ValidationError from "../../../src/error/ValidationError";


describe('RoleService', () => {
    const roleService: RoleService = applicationContext.get(TYPE.RoleService);

    it('can create new roles', async () => {
        const rolesToCreate: { name: string, description: string }[] = [
            {name: 'testRoleA', description: "testRoleA"},
            {name: 'testRoleB', description: "testRoleB"},
            {name: 'testRoleC', description: "testRoleC"},
            {name: 'testRoleD', description: "testRoleD"}
        ];
        const user: User = new User("test", "test", []);
        const result = await roleService.createRoles(rolesToCreate, user);
        expect(result.length).to.be.eq(4);
    });

    it('can find by ids' , async() => {
       const role = await new Role({
           name: 'testRole1',
           description: 'testRole1',
           active: true
       }).save();

       const result = await roleService.findByIds([role.id]);
       expect(result.length).to.be.eq(1);
    });

    it('throws validation exception if roles do not have name', async() => {
       try {
           const rolesToCreate: { name: string, description: string }[] = [
               {name: null, description: "testRoleA"},
               {name: 'testRoleB', description: "testRoleB"},
               {name: null, description: "testRoleC"},
               {name: 'testRoleD', description: "testRoleD"}
           ];
           const user: User = new User("test", "test", []);
           await roleService.createRoles(rolesToCreate, user);
       }  catch (e) {
           expect(e instanceof ValidationError);
           const error = e as ValidationError;
           expect(error.get().length).to.be.eq(2)
       }
    });

    it ('can get roles', async() => {
        const result: {rows: Role[], count: number} = await roleService.roles();
        expect(result.count).to.gte(1);
    });
});
