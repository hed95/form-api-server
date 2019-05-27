import {Sequelize} from "sequelize-typescript";
import {Role} from "../../src/model/Role";
import {expect} from 'chai';

describe("Role", () => {

    const db = '__';
    const sequelize = new Sequelize({
        name: db,
        dialect: 'sqlite',
        username: 'root',
        password: '',
        storage: ':memory:'
    });
    sequelize.addModels([Role]);

    before(async () => {
        await Role.sync({force: true});
    });

    afterEach(async () => {
        await Role.destroy({
            truncate: true
        })
    });

    it('can save role', async () => {
        const role = new Role({
            name: "Test Role",
            description: "Test description",
            active: true
        });
        const result = await role.save();
        expect(result.id).to.not.be.null;
    });

    it('can list all roles', async () => {
        await new Role({
            name: "Test Role",
            description: "Test description",
            active: true
        }).save();

        const roles = await Role.findAll();
        expect(roles.length).to.eq(1)
    });

    it('can update role', async() => {
        const role = new Role({
            name: "Test Role",
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
