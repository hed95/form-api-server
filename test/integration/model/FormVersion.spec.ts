import {expect} from 'chai';
import {FormVersion} from "../../../src/model/FormVersion";
import {Form} from "../../../src/model/Form";

describe("FormVersion", () => {
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
            name: "Test Form A",
            title: "Test form description",
            schema: schema,
            formId: form.id
        });

        const result = await version.save({
            validate: true
        });
        expect(result.id).to.not.be.null;
        expect(result.schema).to.eq(schema);
        expect(result.formId).to.not.eq('');
        const loaded = await FormVersion.findByPk(result.versionId, {
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
            name: "Test Form AVC",
            title: "Test form description",
            schema: schema,
            formId: form.id,
            current: false
        }).save();
        await new FormVersion({
            name: "Test Form Updated",
            title: "Test form description",
            schema: schema,
            formId: form.id,
            current: true
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
