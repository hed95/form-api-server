import TYPE from "../../../src/constant/TYPE";
import {expect} from 'chai';
import {FormService} from "../../../src/service/FormService";
import {applicationContext} from "../setup-test";
import {FormRepository} from "../../../src/types/repository";
import {Role} from "../../../src/model/Role";
import {FormVersion} from "../../../src/model/FormVersion";

describe("FormService", () => {

    it('appcontext loads service and repository', async () => {
        const formService: FormService = applicationContext.get(TYPE.FormService);
        expect(formService).to.be.not.null;
        expect(formService.getFormRepository()).to.be.not.null;
        expect(formService.getFormRepository().name).to.be.eq('Form');
    });


    it('can create multiple versions', async () => {
        const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
        const formService: FormService = applicationContext.get(TYPE.FormService);

        const role = await new Role({
            name: "Test Role X",
            description: "Test description",
            active: true
        }).save();
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form Updated",
            description: "Test form description",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            current: true
        }).save();

        const result: { offset: number, limit: number, data: FormVersion[], total: number }
            = await formService.findAllVersions(form.id, 0, 10);

        expect(result.total).to.eq(1);
        expect(result.offset).to.eq(0);
        expect(result.limit).to.eq(10);
        expect(result.data.length).to.eq(1);
    });

    it('can get latest form version', async () => {
        const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
        const formService: FormService = applicationContext.get(TYPE.FormService);

        const role = await new Role({
            name: "Test Role XXX",
            description: "Test description",
            active: true
        }).save();
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form ABC 123",
            description: "Test form description",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            inDate: new Date(),
            outDate: new Date()
        }).save();

        const lastVersion: FormVersion = await new FormVersion({
            name: "Test Form ABC 123",
            description: "Test form description",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            inDate: new Date(),
            outDate: null
        }).save();

        const result: FormVersion = await formService.findForm(form.id);
        expect(result).to.be.not.null;
        expect(result.id).to.be.eq(lastVersion.id);
        expect(result.latest).to.be.eq(true);
        expect(result.outDate).to.be.null;
        expect(result.form).to.be.not.null;
        expect(result.form.roles.length).to.be.eq(1);;
        expect(result.form.roles[0].name).to.be.eq("Test Role XXX")


    })
});
