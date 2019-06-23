import TYPE from "../../../src/constant/TYPE";
import {expect} from 'chai';
import {FormService} from "../../../src/service/FormService";
import {applicationContext} from "../setup-test";
import {FormRepository} from "../../../src/types/repository";
import {Role} from "../../../src/model/Role";
import {FormVersion} from "../../../src/model/FormVersion";
import {Op} from "sequelize";
import {User} from "../../../src/auth/User";

import ResourceNotFoundError from "../../../src/error/ResourceNotFoundError";
import ResourceValidationError from "../../../src/error/ResourceValidationError";
import {basicForm} from "../../form";
import {FormComment} from "../../../src/model/FormComment";
import {QueryParser} from "../../../src/util/QueryParser";
import _ from 'lodash';
import logger from "../../../src/util/logger";

describe("FormService", () => {

    const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
    const formService: FormService = applicationContext.get(TYPE.FormService);

    let role: Role;
    before(async () => {
        role = await new Role({
            name: "Role for access",
            title: "Test title",
            active: true
        }).save();
        basicForm.name = "";
        basicForm.path = "";
        basicForm.title = "";
    });

    it('appcontext loads service and repository', async () => {
        const formService: FormService = applicationContext.get(TYPE.FormService);
        expect(formService).to.be.not.null;
        expect(formService.formRepository).to.be.not.null;
        expect(formService.formRepository.name).to.be.eq('Form');
    });

    it('cannot get versions if not allowed access', async () => {

        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            current: true
        }).save();

        const user = new User("id", "test", [new Role({
            name: 'someRandomeRole',
            description: "test"
        })]);

        try {
            await formService.findAllVersions(form.id, 0, 10, user);
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });

    it('can create multiple versions', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            current: true
        }).save();

        const user = new User("id", "test", [role]);

        const result: { offset: number, limit: number, versions: FormVersion[], total: number }
            = await formService.findAllVersions(form.id, 0, 10, user);

        expect(result.total).to.eq(1);
        expect(result.offset).to.eq(0);
        expect(result.limit).to.eq(10);
        expect(result.versions.length).to.eq(1);
    });

    it('can get latest form version', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: new Date()
        }).save();

        const lastVersion: FormVersion = await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();
        const user = new User("id", "test", [role]);

        const result: FormVersion = await formService.findForm(form.id, user);
        expect(result).to.be.not.null;
        expect(result.id).to.be.eq(lastVersion.id);
        expect(result.latest).to.be.eq(true);
        expect(result.validTo).to.be.null;
        expect(result.form).to.be.not.null;
        expect(result.form.roles.length).to.be.eq(1);
        expect(result.form.roles[0].name).to.be.eq("Role for access");
    });

    it('can restore a version', async () => {


        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        const oldVersion = await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: new Date()
        }).save();

        const lastVersion: FormVersion = await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();


        const latest: FormVersion = await formService.restore(form.id, oldVersion.versionId);

        expect(latest.versionId).to.eq(oldVersion.versionId);
        expect(latest.validTo).to.be.null;
        expect(latest.latest).to.be.eq(true);

        const user = new User("id", "test", [role]);
        const loaded: FormVersion = await formService.findForm(form.id, user);
        expect(loaded.versionId).to.be.eq(latest.versionId);

        const result = await FormVersion.findOne({
            where: {
                versionId: {[Op.eq]: lastVersion.versionId}
            }
        });
        expect(result.validTo).to.be.not.null;
        expect(result.latest).to.be.eq(false);

    });


    it('form not returned if user does not have role', async () => {

        const form = await formRepository.create({
            createdBy: "test@test.com"
        });
        await form.$add("roles", [role]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();

        const anotherRole = await new Role({
            name: "Test Role For Currentuser",
            title: "Test title",
            active: true
        }).save();
        const user = new User("id", "test", [anotherRole]);
        const loaded: FormVersion = await formService.findForm(form.id, user);
        expect(loaded).to.be.null;
    });
    it('can get form if all role attached to form', async () => {

        const form = await formRepository.create({
            createdBy: "test@test.com"
        });

        const defaultRole = await Role.defaultRole();

        await form.$add("roles", [defaultRole]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();

        const anotherRole = await new Role({
            name: "Currentuser role",
            title: "Test title",
            active: true
        }).save();

        const user = new User("id", "test", [anotherRole]);
        const loaded: FormVersion = await formService.findForm(form.id, user);
        expect(loaded).to.be.not.null;
    });
    it('expected to throw resource not found exception', async () => {

        try {
            await formService.restore("randomId", "randomID")
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.eq(true);
        }

    });
    it('expected to throw resource not version does not exist', async () => {

        try {
            const form = await formRepository.create({
                createdBy: "test@test.com"
            });
            await form.$add("roles", [role]);

            await new FormVersion({
                name: "Test Form ABC 123",
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
            await formService.restore(form.id, "randomID")
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.eq(true);
        }
    });

    it('can get all forms', async () => {

        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 1;
            const index = 1;
            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Test Form ABC${index}${value}`;
            await new FormVersion({
                name: formName,
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                name: formName,
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });
        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 1;
            const index = 1;
            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Test Form ABC${index}${value}Y`;
            await new FormVersion({
                name: formName,
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                name: formName,
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });

        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 2;
            const index = 2;

            const anotherRole = await new Role({
                name: "Test Role For Currentuser Xyz + 1 + 2",
                title: "Test title",
                active: true
            }).save();

            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });

            await form.$add("roles", [anotherRole]);

            const formName = `Test Form ABC${index}${value}X`;
            await new FormVersion({
                name: formName,
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                name: formName,
                title: "Test form title",
                schema: {
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });
        const results: { total: number, forms: FormVersion[] } = await formService.getAllForms(new User("id", "test", [role]));
        expect(results.total).to.be.gte(2);
        expect(results.forms.length).to.be.gte(2);
    });

    it('can create custom role on creating form', async () => {
        const role = new Role({
            name: "ontheflyrole",
            title: "Test title",
            active: true
        });
        const form = await formRepository.create({
            createdBy: `test@test.com`,
            roles: [role]
        }, {
            include: [{
                model: Role
            }]
        });
        expect(form.roles.length).to.eq(1);
        const loadedRole = await Role.findOne({
            where: {
                name: {
                    [Op.eq]: role.name
                }
            }
        });
        expect(loadedRole.name).to.eq(role.name);
    });

    it('fails validation on create', async () => {
        const role = new Role({
            name: "Test Role New One two three",
            title: "Test title",
            active: true
        });
        const user = new User("id", "test", [role]);
        try {
            await formService.create(user, {});
        } catch (err) {
            expect(err instanceof ResourceValidationError).to.eq(true);
            const validationError = err as ResourceValidationError;
            expect(validationError.get().length).to.be.eq(4);
        }
    });

    it('can create a form', async () => {
        const role = new Role({
            name: "Test Role New One two three",
            title: "Test title",
            active: true
        });
        const user = new User("id", "test", [role]);
        basicForm.name = "new";
        basicForm.path = "new";
        basicForm.title = "new";
        const version = await formService.create(user, basicForm);
        expect(version).to.be.not.null;

        const loaded = await formService.findForm(version, user);
        expect(loaded).to.be.not.null;
        expect(loaded.form.roles.length).to.eq(1);
        expect(loaded.form.roles[0].name).to.eq("anonymous");
    });

    it('can delete a form', async () => {
        const role = new Role({
            name: "TestX12XX",
            title: "Test title",
            active: true
        });
        const user = new User("id", "test", [role]);
        basicForm.name = "new2";
        basicForm.path = "new2";
        basicForm.title = "new2";
        const formId: string = await formService.create(user, basicForm);
        expect(formId).to.be.not.null;


        const deleted = await formService.delete(formId, user);
        expect(deleted).to.eq(true);

        const loaded = await formService.findForm(formId, user);
        expect(loaded).to.be.null;

    });

    it('can create comment', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });

        const defaultRole = await Role.defaultRole();

        await form.$add("roles", [defaultRole]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();

        const user = new User("id", "test", [role]);
        const formComment = new FormComment({
            comment: "FormCommentary test"
        });
        const comment: FormComment = await formService.createComment(form.id, user, formComment);
        console.log(comment.createdOn);
        expect(comment).to.be.not.null;

    });

    it('can get comments', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });

        const defaultRole = await Role.defaultRole();

        await form.$add("roles", [defaultRole]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();

        const user = new User("id", "test", [role]);
        const formComment = new FormComment({
            comment: "FormCommentary test"
        });
        await formService.createComment(form.id, user, formComment);
        const comments: FormComment[] = await formService.getComments(form.id, user);
        expect(comments.length).to.be.eq(1);
        expect(comments[0].createdBy).to.be.eq("test");
    });

    it('throws error if form does not exist for get comments call', async () => {
        try {
            const user = new User("id", "test", [role]);
            await formService.getComments("xx", user);
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });

    it('can update form roles', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });

        const defaultRole = await Role.defaultRole();

        await form.$add("roles", [defaultRole]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();


        const newRole = await new Role({
            name: "NewRoleForTesting",
            title: "Test title",
            active: true
        }).save();

        const user = new User("id", "test", [newRole]);

        await formService.updateRoles(form.id, [newRole], user);

        const result: FormVersion = await formService.findForm(form.id, user);
        expect(result.form.roles.length).to.be.eq(1);
        expect(result.form.roles[0].name).to.be.eq('NewRoleForTesting');
    });

    it('select forms with title and id only', async () => {
        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 1;
            const index = 1;
            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Test Form ABC${index}${value}`;
            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });
        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 1;
            const index = 1;
            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Test Form ABC${index}${value}Y`;
            await new FormVersion({
                schema: {
                    _id: form.id,
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                schema: {
                    _id: form.id,
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });

        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 2;
            const index = 2;

            const anotherRole = await new Role({
                name: "Test Role XCX",
                title: "Test title",
                active: true
            }).save();

            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });

            await form.$add("roles", [anotherRole]);

            const formName = `Test Form ABC${index}${value}X`;
            await new FormVersion({
                schema: {
                    _id: form.id,
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                schema: {
                    _id: form.id,
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });
        const results: { total: number, forms: FormVersion[] } = await formService.getAllForms(new User("id", "test", [role]), 20, 0, null, ['title', '_id']);
        expect(results.total).to.be.gte(2);

        // @ts-ignore
        expect(results.forms[0].title).to.be.not.null;
        // @ts-ignore
        expect(results.forms[0]._id).to.be.not.null;
        expect(results.forms[0].schema).to.be.eq(undefined);
        expect(results.forms[0].latest).to.be.eq(undefined);

    });

    it('cannot create form if title already exists', async () => {
        const role = new Role({
            name: "Test Role New One two three",
            title: "Test title",
            active: true
        });
        const user = new User("id", "test", [role]);
        basicForm.name = "newA";
        basicForm.path = "newA";
        basicForm.title = "newA";
        await formService.create(user, basicForm);

        try {
            await formService.create(user, basicForm);
        } catch (e) {
            expect(e instanceof ResourceValidationError).to.be.eq(true);
            const validationError = e as ResourceValidationError;
            expect(validationError.get().length).to.be.eq(3);
        }

    });

    it('can get all forms with query filter', async () => {

        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 1;
            const index = 1;
            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Test Form ABC${index}${value}`;
            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test form X",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test form X",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });
        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 1;
            const index = 1;
            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Test Form X ABC${index}${value}Y`;
            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test X form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test X form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });

        await formRepository.sequelize.transaction(async (transaction: any) => {
            const value = 2;
            const index = 2;

            const anotherRole = await new Role({
                name: "Test Role For Currentuser XYXFF",
                title: "Test title",
                active: true
            }).save();

            const form = await formRepository.create({
                createdBy: `test${value}@test.com`
            });

            await form.$add("roles", [anotherRole]);

            const formName = `Test XX Form ABC${index}${value}X`;
            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test Y form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: false,
                validFrom: new Date(),
                validTo: new Date()
            }).save();

            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Test form title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });

        const query: object = new QueryParser().parse(['title__eq__Test form X', 'name__eq__Test Form ABC11']);

        const results: { total: number, forms: FormVersion[] } = await formService.getAllForms(new User("id", "test", [role]), 20, 0, {
            'schema.title': {
                [Op.eq]: 'Test form X'
            },
            'schema.name': {
                [Op.eq]: 'Test Form ABC11'
            }
        }, []);

        expect(results.total).to.be.gte(1);
        expect(results.forms.length).to.be.gte(1);

        const resultsWithRaw: { total: number, forms: FormVersion[] } = await formService.getAllForms(new User("id", "test", [role]), 20, 0, query, []);

        expect(resultsWithRaw.total).to.be.gte(1);
        expect(resultsWithRaw.forms.length).to.be.gte(1);

    });

    it('can find title with startsWith', async () => {
        await formRepository.sequelize.transaction(async (transaction: any) => {
            const form = await formRepository.create({
                createdBy: `test@test.com`
            });
            await form.$add("roles", [role]);

            const formName = `Apple with title`;
            await new FormVersion({
                schema: {
                    name: formName,
                    title: "Apple with title",
                    components: [],
                    display: "wizard"
                },
                formId: form.id,
                latest: true,
                validFrom: new Date(),
                validTo: null
            }).save();
        });
        const query: object = new QueryParser().parse(['title__startsWith__Apple']);

        const results: { total: number, forms: FormVersion[] } = await formService.getAllForms(new User("id", "test", [role]), 20, 0, query, []);

        expect(results.total).to.be.eq(1);
    });

    it('can update form', async () => {

        const role = new Role({
            name: "Test Role New One two three",
            title: "Test title",
            active: true
        });
        const user = new User("id", "test", [role]);
        basicForm.name = "newForm";
        basicForm.path = "newForm";
        basicForm.title = "newForm";
        const version = await formService.create(user, basicForm);

        expect(version).to.be.not.null;
        let loaded = await formService.findForm(version, user);
        // @ts-ignore
        expect(loaded.schema.components.length).to.be.eq(2);

        const toUpdate = _.cloneDeep(basicForm);
        toUpdate.components.push({
            "label": "Text Field A",
            "widget": {
                "type": "input"
            },
            "tableView": true,
            "inputFormat": "plain",
            "validate": {
                "required": true
            },
            "key": "textFieldABC",
            "type": "textfield",
            "input": true
        });

        const updated = await formService.update(version, toUpdate, user);
        expect(updated).to.be.not.null;

        loaded = await formService.findForm(version, user);
        // @ts-ignore
        expect(loaded.schema.components.length).to.be.eq(3);
    });

    it('throws exception if formid for update does not exist', async () => {
        try {
            const user = new User("id", "test", [role]);
            await formService.update('xxxx', basicForm, user);
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });
    it('throws exception if form to update is invalid', async () => {
        try {
            const role = new Role({
                name: "Test Role New One two three",
                title: "Test title",
                active: true
            });
            const user = new User("id", "test", [role]);
            basicForm.name = "newForm";
            basicForm.path = "newForm";
            basicForm.title = "newForm";
            const version = await formService.create(user, basicForm);

            delete basicForm.name;
            delete basicForm.title;

            await formService.update(version, basicForm, user);
        } catch (e) {
            logger.error(e);
            expect(e instanceof ResourceValidationError).to.be.eq(true);
        }
    });
});



