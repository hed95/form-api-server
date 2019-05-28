import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {Form} from "./Form";
import {Role} from "./Role";

@Table
export class FormRoles extends Model<FormRoles>{

    @ForeignKey(() => Form)
    @Column
    formVersionId: string;

    @ForeignKey(() => Role)
    @Column
    roleId: string;
}
