import 'reflect-metadata';
import {expect} from "chai";

import {RolesController} from "../../../src/controller";
import {MockResponse} from "../../MockResponse";
import {Arg, Substitute} from '@fluffy-spoon/substitute';
import {MockRequest} from "../../MockRequest";
import {RoleService} from "../../../src/service/RoleService";
import {User} from "../../../src/auth/User";
import ValidationError from "../../../src/error/ValidationError";
import {FormVersion} from "../../../src/model/FormVersion";
import {Role} from "../../../src/model/Role";

describe("RoleController", () => {

    let mockResponse: any;
    let mockRequest: any;
    let rolesController: RolesController;
    let roleService: RoleService;

    beforeEach(() => {
        mockResponse = new MockResponse();
        mockRequest = new MockRequest("/roles");
        roleService = Substitute.for<RoleService>();
        rolesController = new RolesController(roleService);

    });

    afterEach(() => {
    });

    it('can create roles', async () => {
        const user = new User("id", "email");
        // @ts-ignore
        roleService.createRoles(Arg.any(), Arg.any()).returns(Promise.resolve([]));
        await rolesController.create([], mockResponse, user);
        expect(mockResponse.getStatus()).to.be.eq(201);
    });

    it('throws 400 for bad roles', async () => {
        const user = new User("id", "email");
        // @ts-ignore
        roleService.createRoles(Arg.any(), Arg.any()).returns(Promise.reject(new ValidationError("Failed", [])));
        await rolesController.create([], mockResponse, user);
        expect(mockResponse.getStatus()).to.be.eq(400);
    });

    it('can get roles by ids', async() => {
        Object.assign(Role, {});
        const role: Role = Object.assign(Role.prototype, {});
        role.name = "test";
        role.description = "test";

        // @ts-ignore
        roleService.roles(Arg.any(), Arg.any()).returns(Promise.resolve({rows: [role], count: 1}));

        const result: {total: number, roles: Role[] } = await rolesController.roles();

        expect(result.total).to.be.eq(1);

    })

});
