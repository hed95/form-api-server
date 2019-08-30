import {FormVersion} from '../model/FormVersion';
import {ResourceAssembler} from '../interfaces/ResourceAssembler';
import _ from 'lodash';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {Role} from '../model/Role';
import * as express from 'express';

@provide(TYPE.FormResourceAssembler)
export class FormResourceAssembler implements ResourceAssembler<FormVersion, object> {

    public  toResource(entity: FormVersion, req: express.Request, includeLinks: boolean = true): object {
        if (!entity.schema) {
            return _.cloneDeepWith(entity, (value) => {
                const form = value.form;
                value.createdBy = form.createdBy;
                value.createdOn = form.createdOn;
                value.updatedBy = form.updatedBy;
                const toReturn = JSON.parse(JSON.stringify(value));
                toReturn.updatedOn = form.updatedOn;
                delete toReturn.form;
                return toReturn;
            });
        }
        const resource: any = _.cloneDeep(entity.schema);
        resource.access = entity.form ? _.map((entity.form.roles), (role: Role) => {
            return {
                id: role.id,
                name: role.name,
                description: role.description,
                active: role.active,
            };
        }) : null;
        resource.versionId = entity.versionId;
        resource.createdOn = entity.form.createdOn;
        resource.createdBy = entity.form.createdBy;
        resource.updatedBy = entity.form.updatedBy;
        resource.updatedOn = entity.form.updatedOn;
        resource.latest = entity.latest;
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
