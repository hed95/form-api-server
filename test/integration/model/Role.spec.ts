import {Role} from "../../../src/model/Role";
import {expect} from 'chai';

describe("Role", () => {
    it('can save role', async () => {
        const role = new Role({
            name: "Test Role A",
            description: "Test description",
            active: true
        });
        const result = await role.save();
        expect(result.id).to.not.be.null;
    });

    it('can list all roles', async () => {
        await new Role({
            name: "Test Role X",
            description: "Test description",
            active: true
        }).save();

        const roles = await Role.findAll();
        expect(roles.length).to.greaterThan(1);
    });

    it('can update role', async () => {
        const role = new Role({
            name: "Test Role Y",
            description: "Test description",
            active: true
        });
        const result = await role.save();
        const updated = await result.update({
            description: "new"
        });

        expect(updated.description).to.eq('new');
    });
});
