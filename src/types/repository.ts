import {Form} from "../model/Form";
import {FormVersion} from "../model/FormVersion";
import {FormRoles} from "../model/FormRoles";
import {Role} from "../model/Role";
import {FormComment} from "../model/FormComment";

export type FormRepository = typeof Form;
export type FormVersionRepository = typeof FormVersion;
export type FormRolesRepository = typeof FormRoles;
export type RoleRepository = typeof Role;
export type FormCommentRepository = typeof FormComment;
