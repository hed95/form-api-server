import {Form} from '../model/Form';
import {FormComment} from '../model/FormComment';
import {FormVersion} from '../model/FormVersion';
import {Role} from '../model/Role';
import {FormRoles} from '../model/FormRoles';

export type FormRepository = typeof Form;
export type FormVersionRepository = typeof FormVersion;
export type RoleRepository = typeof Role;
export type FormCommentRepository = typeof FormComment;
export type FormRolesRepository = typeof FormRoles;
