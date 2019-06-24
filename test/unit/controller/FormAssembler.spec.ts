import 'reflect-metadata';
import {expect} from "chai";
import {FormResourceAssembler} from "../../../src/controller/FormResourceAssembler";
import {ResourceAssembler} from "../../../src/controller/ResourceAssembler";
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

    it('can convert formversion into form', () => {
        const date = new Date();
        const expectedResult: object = {
            display: 'form',
            components: [],
            access: [{
                id: 'test',
                name: 'test'
            }],
            versionId: 'versionId',
            createdBy: 'test',
            createdAt: date,
            id: 'formId',
            links: [
                {
                    "rel": "self",
                    "title": "Self",
                    "method": "GET",
                    "href": "/api/v1/form/formId"
                },
                {
                    "rel": "allVersions",
                    "title": "Show all versions",
                    "method": "GET",
                    "href": "/api/v1/form/formId/versions"
                },
                {
                    "rel": "comments",
                    "title": "Show all comments",
                    "method": "GET",
                    "href": "/api/v1/form/formId/comments"
                },
                {
                    "rel": "create-comment",
                    "title": "Add a comment",
                    "method": "POST",
                    "href": "/api/v1/form/formId/comments"
                },
                {
                    "rel": "update",
                    "title": "Update form",
                    "method": "PUT",
                    "href": "/api/v1/form/formId"
                },
                {
                    "rel": "delete",
                    "title": "Delete form",
                    "method": "DELETE",
                    "href": "/api/v1/form/formId"
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
        version.createdAt = date;
        version.createdBy = 'test';
        role.name = 'test';
        role.id = 'test';
        role.description = 'test';
        role.active = true;
        form.roles = [role];
        form.id = 'formId';
        version.form = form;

        version.versionId = 'versionId';

        const result = underTest.toResource(version, mockRequest);

        expect(JSON.stringify(result)).to.be.eq(JSON.stringify(expectedResult));

    });
});