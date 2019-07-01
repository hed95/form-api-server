import {expect} from 'chai';
import {applicationContext} from "../setup-test";
import TYPE from "../../../src/constant/TYPE";
import {RoleService} from "../../../src/service/RoleService";
import {User} from "../../../src/auth/User";
import {Role} from "../../../src/model/Role";
import ResourceValidationError from "../../../src/error/ResourceValidationError";


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

    it('can create if role name does not exist' , async() => {
       const result = await roleService.findOrCreate([{
           name: 'roleThatDoesNotExist',
           description: 'x',
           active: true
       }]);
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
           expect(e instanceof ResourceValidationError);
           const error = e as ResourceValidationError;
           expect(error.get().length).to.be.eq(2)
       }
    });

    it ('can get roles', async() => {
        const result: {rows: Role[], count: number} = await roleService.roles();
        expect(result.count).to.gte(1);
    });
});
