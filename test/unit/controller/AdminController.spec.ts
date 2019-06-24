import 'reflect-metadata';
import {expect} from "chai";
import {AdminController} from "../../../src/controller";
import {FormService} from "../../../src/service/FormService";
import {FormResourceAssembler} from "../../../src/controller/FormResourceAssembler";
import {MockResponse} from "../../MockResponse";
import {MockRequest} from "../../MockRequest";
import {Arg, Substitute} from "@fluffy-spoon/substitute";
import {User} from "../../../src/auth/User";
import {FormVersion} from "../../../src/model/FormVersion";

describe('AdminController', () => {

    let mockResponse: any;
    let mockRequest: any;
    let underTest: AdminController;
    let formService: FormService;
    let formResourceAssembler: FormResourceAssembler;

    beforeEach(() => {
        mockResponse = new MockResponse();
        mockRequest = new MockRequest("/forms", "/api/v1");
        formService = Substitute.for<FormService>();
        formResourceAssembler = Substitute.for<FormResourceAssembler>();
        underTest = new AdminController(formService);

    });

    it('can return forms', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };
        // @ts-ignore
        formService.allForms(Arg.any(), Arg.any()).returns(Promise.resolve({total: 1, versions: [version]}));

        await underTest.allForms(mockRequest, mockResponse);

        expect(mockResponse.getJsonData().total).to.be.eq(1);
        expect(mockResponse.getJsonData().versions.length).to.be.eq(1);

    });
});
