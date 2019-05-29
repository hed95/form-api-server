import {Form} from "../model/Form";
import {FormVersion} from "../model/FormVersion";
import {FormRoles} from "../model/FormRoles";
import {Role} from "../model/Role";

export type FormRepository = typeof Form;
export type FormVersionRepository = typeof FormVersion;
export type FormRolesRepository = typeof FormRoles;
export type RoleRepository = typeof Role;
