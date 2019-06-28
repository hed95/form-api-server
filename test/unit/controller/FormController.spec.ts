import 'reflect-metadata';
import {expect} from "chai";
import {FormService} from "../../../src/service/FormService";

import {FormController} from "../../../src/controller";
import {MockResponse} from "../../MockResponse";
import {User} from "../../../src/auth/User";
import {FormVersion} from "../../../src/model/FormVersion";
import {Arg, Substitute} from '@fluffy-spoon/substitute';
import {Form} from "../../../src/model/Form";
import {FormComment} from "../../../src/model/FormComment";
import {Role} from "../../../src/model/Role";
import {MockRequest} from "../../MockRequest";
import {ValidationService} from "../../../src/service/ValidationService";
import {FormResourceAssembler} from "../../../src/controller/FormResourceAssembler";
import {CommentService} from "../../../src/service/CommentService";
import ResourceNotFoundError from "../../../src/error/ResourceNotFoundError";

describe("FormController", () => {

    let mockResponse: any;
    let mockRequest: any;
    let formController: FormController;
    let formService: FormService;
    let validationService: ValidationService;
    let formResourceAssembler: FormResourceAssembler;
    let commentService: CommentService;

    beforeEach(() => {
        mockResponse = new MockResponse();
        mockRequest = new MockRequest("/forms", "/api/v1");
        formService = Substitute.for<FormService>();
        validationService = Substitute.for<ValidationService>();
        formResourceAssembler = Substitute.for<FormResourceAssembler>();
        commentService = Substitute.for<CommentService>();
        formController = new FormController(formService, validationService, formResourceAssembler, commentService);

    });

    afterEach(() => {
    });

    it('can get a form', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        // @ts-ignore
        formResourceAssembler.toResource(Arg.any(), Arg.any()).returns({
            display: 'form',
            components: []
        });

        await formController.get("ea1ddad5-aec3-44a4-a730-07b50b8be752", mockRequest, mockResponse, user);
        expect(JSON.stringify(mockResponse.getJsonData())).to.be.eq(JSON.stringify(version.schema));
    });


    it('returns all versions', async () => {

        const user = new User("id", "email");

        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        const versions = [version];

        // @ts-ignore
        formService.findAllVersions(Arg.any(), Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve({
            offset: 0,
            limit: 10,
            versions: versions,
            total: 1
        }));

        await formController.allVersions("id", 0, 20, mockRequest, mockResponse, user);
        expect(mockResponse.getJsonData().total).to.eq(1);
        expect(mockResponse.getJsonData().versions.length).to.eq(1);

    });

    it('can create a form', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        Object.assign(Form, {})
        const form: Form = Object.assign(Form.prototype, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        form.id = 'formId';
        version.schema = {
            display: 'form',
            components: []
        };
        version.form = form;
        // @ts-ignore
        formService.create(Arg.any(), Arg.any()).returns(Promise.resolve(version.form.id));

        await formController.create({}, mockRequest, mockResponse, user);

        expect(mockResponse.getStatus()).to.eq(201);
        expect(mockResponse.getLocation()).to.eq("/api/v1/forms/formId");

    });


    it('can create a comment', async () => {
        const user = new User("id", "email");
        const formComment: FormComment = Object.assign(FormComment.prototype, {});
        formComment.comment = "Hello";

        // @ts-ignore
        formService.createComment("formId", user, formComment).returns(Promise.resolve(formComment));

        await formController.createComment("formId", formComment, mockResponse, user);

        expect(mockResponse.getStatus()).to.eq(201);

    });


    it('can update form roles', async () => {
        const user = new User("id", "email");
        const newRole: Role = Object.assign(Role.prototype, {});
        newRole.name = "Hello";

        // @ts-ignore
        formService.updateRoles("formId", [newRole], user).returns(Promise.resolve());

        await formController.updateRoles("formId", [newRole], mockResponse, user);

        expect(mockResponse.getStatus()).to.eq(200);
    });

    it('can return forms', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        Object.assign(Form, {});
        const form: Form = Object.assign(Form.prototype, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        form.id = 'formId';
        version.schema = {
            display: 'form',
            components: []
        };
        version.form = form;
        // @ts-ignore
        formService.getAllForms(Arg.any(), Arg.any(), Arg.any(), Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve({
            total: 1,
            forms: [version]
        }));

        const result: { total: number, forms: object[] }
            = await formController.getForms(20, 0, null, null, false, user,
            mockRequest, mockResponse);

        expect(result.total).to.be.eq(1);
        expect(result.forms.length).to.be.eq(1);

    });

    it('can find by version id', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        // @ts-ignore
        formService.findByVersionId(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        // @ts-ignore
        formResourceAssembler.toResource(Arg.any(), Arg.any()).returns({
            display: 'form',
            components: []
        });

        await formController.getByVersionId("id", mockRequest, mockResponse, user);

        expect(JSON.stringify(mockResponse.getJsonData())).to.be.eq(JSON.stringify({
            display: 'form',
            components: []
        }));

    });
    it('throws error if form does not exist', async () => {
        const user = new User("id", "email");
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(null));
        try {
            await formController.get("id", mockRequest, mockResponse, user);
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });

});
