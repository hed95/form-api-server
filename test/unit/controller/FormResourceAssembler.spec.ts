import 'reflect-metadata';
import {expect} from "chai";
import {FormResourceAssembler} from "../../../src/controller/FormResourceAssembler";
import {ResourceAssembler} from "../../../src/interfaces/ResourceAssembler";
import {FormVersion} from "../../../src/model/FormVersion";
import {Role} from "../../../src/model/Role";
import {Form} from "../../../src/model/Form";
import {MockRequest} from "../../MockRequest";

describe('FormResourceAssembler', () => {

    let mockRequest: any;

    beforeEach(() => {
        mockRequest = new MockRequest("/forms", "/api/v1");
    });
    const underTest: ResourceAssembler<FormVersion, object> = new FormResourceAssembler();

    it('returns form when no schema', () => {
        const date = new Date();
        const expectedResult: object = {
            title: 'testTitle',
            createdBy: 'test',
            createdOn: date,
            updatedBy: 'test',
            updatedOn: date

        };

        const version: FormVersion = Object.assign({}, FormVersion.prototype);
        const role: Role = Object.assign({}, Role.prototype);
        const form: Form = Object.assign({}, Form.prototype);


        role.name = 'test';
        role.id = 'test';
        role.description = 'test';
        role.active = true;
        form.roles = [role];
        form.createdOn = date;
        form.createdBy = 'test';
        form.updatedOn = date;
        form.updatedBy = 'test';
        form.id = 'formId';
        version.form = form;
        version.schema = undefined;
        // @ts-ignore
        version.title = 'testTitle';

        const result = underTest.toResource(version, mockRequest);

        expect(JSON.stringify(result)).to.be.eq(JSON.stringify(expectedResult));
    });
    it('can convert formversion into form', () => {
        const date = new Date();
        const expectedResult: object = {
            display: 'form',
            components: [],
            access: [{
                id: 'test',
                name: 'test',
                description: 'test'
            }],
            versionId: 'versionId',
            createdOn: date,
            createdBy: 'test',
            updatedBy: 'test',
            updatedOn: date,
            id: 'formId',
            links: [
                {
                    "rel": "self",
                    "title": "Self",
                    "method": "GET",
                    "href": "/api/v1/forms/formId"
                },
                {
                    "rel": "allVersions",
                    "title": "Show all versions",
                    "method": "GET",
                    "href": "/api/v1/forms/formId/versions"
                },
                {
                    "rel": "comments",
                    "title": "Show all comments",
                    "method": "GET",
                    "href": "/api/v1/forms/formId/comments"
                },
                {
                    "rel": "create-comment",
                    "title": "Add a comment",
                    "method": "POST",
                    "href": "/api/v1/forms/formId/comments"
                },
                {
                    "rel": "update",
                    "title": "Update form",
                    "method": "PUT",
                    "href": "/api/v1/forms/formId"
                },
                {
                    "rel": "delete",
                    "title": "Delete form",
                    "method": "DELETE",
                    "href": "/api/v1/forms/formId"
                }
            ]
        };

        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        const role: Role = Object.assign(Role.prototype, {});
        const form: Form = Object.assign(Form.prototype, {});

        version.schema = {
            display: 'form',
            components: [],
        };
        version.createdOn = date;
        version.createdBy = 'test';
        role.name = 'test';
        role.id = 'test';
        role.description = 'test';
        role.active = true;
        form.roles = [role];
        form.createdOn = date;
        form.createdBy = 'test';
        form.updatedOn = date;
        form.updatedBy = 'test';
        form.id = 'formId';
        version.form = form;

        version.versionId = 'versionId';

        const result = underTest.toResource(version, mockRequest);

        expect(JSON.stringify(result)).to.be.eq(JSON.stringify(expectedResult));

    });


});
