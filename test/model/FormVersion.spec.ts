import {Sequelize} from "sequelize-typescript";
import {expect} from 'chai';
import {FormVersion} from "../../src/model/FormVersion";
import {Form} from "../../src/model/Form";

describe("FormVersion", () => {
    const db = '__';
    const sequelize = new Sequelize({
        name: db,
        dialect: 'sqlite',
        username: 'root',
        password: '',
        storage: ':memory:'
    });
    sequelize.addModels([Form, FormVersion]);

    before(async () => {
        await Form.sync({force: true});
        await FormVersion.sync({force: true});
    });

    afterEach(async () => {
        await FormVersion.destroy({
            truncate: true
        });
        await Form.destroy({
            truncate: true
        });

    });

    it('can create a version', async () => {
        const schema: object = {
            "name": "test",
            "components": [
                {
                    "key": "key"
                }
            ],
            "display": "wizard"
        };

        const form = await new Form({
            createdBy: "test@tes.com"
        }).save();
        const version = new FormVersion({
            name: "Test Form",
            description: "Test form description",
            schema: schema,
            formId: form.id
        });

        const result = await version.save({
            validate: true
        });
        expect(result.id).to.not.be.null;
        expect(result.schema).to.eq(schema);
        expect(result.formId).to.not.eq('');
        const loaded = await FormVersion.findByPk(result.id, {
            include: [
                {model: Form}
            ]
        });

        expect(loaded.form.id).to.eq(form.id)

    });

    it('can create multiple versions', async () => {
        const schema: object = {
            "name": "test",
            "components": [
                {
                    "key": "key"
                }
            ],
            "display": "wizard"
        };

        const form = await new Form().save();

        await new FormVersion({
            name: "Test Form",
            description: "Test form description",
            schema: schema,
            formId: form.id
        }).save({
            include: Form
        });
        await new FormVersion({
            name: "Test Form Updated",
            description: "Test form description",
            schema: schema,
            formId: form.id
        }).save();

        const versions = await FormVersion.findAll({
            where: {
                formId: form.id
            },
            include: [
                {
                    model: Form
                }
            ]
        });
        expect(versions.length).to.eq(2);
        expect(JSON.stringify(versions[0].schema)).to.eq(JSON.stringify(schema));
    });

});
