import {FormRoles} from "../../../src/model/FormRoles";
import {Role} from "../../../src/model/Role";
import {Form} from "../../../src/model/Form";
import {expect} from 'chai';
import {serialize} from "class-transformer";
import {sequelizeProvider} from "../setup-test";
import {FormVersion} from "../../../src/model/FormVersion";

describe("Form", () => {

    it('can create a form with roles', async () => {

        const role = await new Role({
            name: "roleA",
            description: "roleDescription",
            active: true
        }).save();

        const form = await new Form({
            createdBy: "test@test"
        }).save();

        await form.$add("roles", [role], {
            through: 'formroles'
        });

        const result = await FormRoles.findAll({});
        expect(result.length).to.eq(1)

        const formLoaded = await Form.findByPk(form.id, {
            include: [{
                model: Role
            }]
        });
        expect(formLoaded.roles.length).to.eq(1);

    });
});
