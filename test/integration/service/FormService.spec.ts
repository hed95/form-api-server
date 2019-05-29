import TYPE from "../../../src/constant/TYPE";
import {expect} from 'chai';
import {FormService} from "../../../src/service/FormService";
import {applicationContext} from "../setup-test";
import {FormRepository} from "../../../src/types/repository";
import {Role} from "../../../src/model/Role";
import {FormVersion} from "../../../src/model/FormVersion";
import {Op} from "sequelize";
import {User} from "../../../src/model/User";

describe("FormService", () => {

    it('appcontext loads service and repository', async () => {
        const formService: FormService = applicationContext.get(TYPE.FormService);
        expect(formService).to.be.not.null;
        expect(formService.formRepository).to.be.not.null;
        expect(formService.formRepository.name).to.be.eq('Form');
    });


    it('can create multiple versions', async () => {
        const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
        const formService: FormService = applicationContext.get(TYPE.FormService);

        const role = await new Role({
            name: "Test Role",
            description: "Test description",
            active: true
        }).save();
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form 123",
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
        const user = new User("id", "test", [role]);
        const result: FormVersion = await formService.findForm(form.id, user);
        expect(result).to.be.not.null;
        expect(result.id).to.be.eq(lastVersion.id);
        expect(result.latest).to.be.eq(true);
        expect(result.outDate).to.be.null;
        expect(result.form).to.be.not.null;
        expect(result.form.roles.length).to.be.eq(1);
        expect(result.form.roles[0].name).to.be.eq("Test Role XXX")
    });

    it('can restore a version', async () => {

        const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
        const formService: FormService = applicationContext.get(TYPE.FormService);

        const role = await new Role({
            name: "Test Role XX12",
            description: "Test description",
            active: true
        }).save();
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        const oldVersion = await new FormVersion({
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


        const latest: FormVersion = await formService.restore(form.id, oldVersion.id);

        expect(latest.id).to.eq(oldVersion.id);
        expect(latest.outDate).to.be.null;
        expect(latest.latest).to.be.eq(true);

        const user = new User("id", "test", [role]);
        const loaded : FormVersion = await formService.findForm(form.id, user);
        expect(loaded.id).to.be.eq(latest.id);

        const result = await FormVersion.findOne({
            where: {
               id: {[Op.eq]: lastVersion.id}
            }
        });
        expect(result.outDate).to.be.not.null;
        expect(result.latest).to.be.eq(false);

    });

    it('form not returned if user does not have role', async () => {
        const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
        const formService: FormService = applicationContext.get(TYPE.FormService);

        const role = await new Role({
            name: "Test Role XX13",
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
            outDate: null
        }).save();

        const anotherRole = await new Role({
            name: "Test Role For User",
            description: "Test description",
            active: true
        }).save();
        const user = new User("id", "test", [anotherRole]);
        const loaded : FormVersion = await formService.findForm(form.id, user);
        expect(loaded).to.be.null;

    });
});
