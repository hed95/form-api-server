import {FormVersion} from '../model/FormVersion';
import {ResourceAssembler} from '../interfaces/ResourceAssembler';
import _ from 'lodash';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {Role} from '../model/Role';
import * as express from 'express';

@provide(TYPE.FormResourceAssembler)
export class FormResourceAssembler implements ResourceAssembler<FormVersion, object> {

    public toResource(entity: FormVersion, req: express.Request, includeLinks: boolean = true): object {
        const resource: any = _.cloneDeep(entity.schema);
        resource.access = _.map((entity.form.roles), (role: Role) => {
            return {
                id: role.id,
                name: role.name,
            };
        });
        resource.versionId = entity.versionId;
        resource.createdBy = entity.createdBy;
        resource.createdAt = entity.createdAt;
        const formId: string = entity.form.id;
        resource.id = formId;
        if (includeLinks) {
            resource.links = [
                {
                    rel: 'self',
                    title: 'Self',
                    method: 'GET',
                    href: `${req.baseUrl}/forms/${formId}`,
                },
                {
                    rel: 'allVersions',
                    title: 'Show all versions',
                    method: 'GET',
                    href: `${req.baseUrl}/forms/${formId}/versions`,
                },
                {
                    rel: 'comments',
                    title: 'Show all comments',
                    method: 'GET',
                    href: `${req.baseUrl}/forms/${formId}/comments`,
                },
                {
                    rel: 'create-comment',
                    title: 'Add a comment',
                    method: 'POST',
                    href: `${req.baseUrl}/forms/${formId}/comments`,
                },
                {
                    rel: 'update',
                    title: 'Update form',
                    method: 'PUT',
                    href: `${req.baseUrl}/forms/${formId}`,
                },
                {
                    rel: 'delete',
                    title: 'Delete form',
                    method: 'DELETE',
                    href: `${req.baseUrl}/forms/${formId}`,
                },
            ];
        }
        return resource;
    }

}
