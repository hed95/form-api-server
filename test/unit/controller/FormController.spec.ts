import 'reflect-metadata';
import {expect} from "chai";
import {FormService} from "../../../src/service/FormService";

import {FormController} from "../../../src/controller";
import {MockResponse} from "../../MockResponse";
import {User} from "../../../src/auth/User";
import {FormVersion} from "../../../src/model/FormVersion";
import {Arg, Substitute} from '@fluffy-spoon/substitute';
import ResourceNotFoundError from "../../../src/error/ResourceNotFoundError";
import InternalServerError from "../../../src/error/InternalServerError";

describe("FormController", () => {

    let mockResponse: any;
    let formController: FormController;
    let formService: FormService;

    beforeEach(() => {
        mockResponse = new MockResponse();
        formService = Substitute.for<FormService>();
        formController = new FormController(formService);

    });

    afterEach(() => {
    });

    it ('can get a form', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        await formController.get("id",mockResponse, user);
        expect(mockResponse.getJsonData()).to.be.eq(version.schema);
    });

    it('returns 404 if form not present', async () => {
        const user = new User("id", "email");

        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(null));

        await formController.get("id",mockResponse, user);
        expect(mockResponse.getStatus()).to.eq(404);
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
       formService.findAllVersions(Arg.any(), Arg.any(), Arg.any(),Arg.any()).returns(Promise.resolve({
            offset: 0,
            limit: 10,
            versions: versions,
            total: 1
        }));

        await formController.allVersions("id", 0, 20, mockResponse, user);
        expect(mockResponse.getJsonData().total).to.eq(1);
        expect(mockResponse.getJsonData().versions.length).to.eq(1);

    });

    it ('throws exception if form not accessible for versions', async () => {
        const user = new User("id", "email");

        // @ts-ignore
        formService.findAllVersions(Arg.any(), Arg.any(), Arg.any(),Arg.any()).returns(Promise.reject(new ResourceNotFoundError("Not found")));

        await formController.allVersions("id", 0, 20, mockResponse, user);
        expect(mockResponse.getStatus()).to.eq(404);
    });

    it ('throws exception for internal exception', async () => {
        const user = new User("id", "email");

        // @ts-ignore
        formService.findAllVersions(Arg.any(), Arg.any(), Arg.any(),Arg.any()).returns(Promise.reject(new InternalServerError("Something went wrong")));

        await formController.allVersions("id", 0, 20, mockResponse, user);
        expect(mockResponse.getStatus()).to.eq(500);
        expect(mockResponse.getJsonData().message).to.eq("InternalServerError: Something went wrong");
    });
});
