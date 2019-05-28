import {BelongsToMany, Column, CreatedAt, DataType, Model, Table} from "sequelize-typescript";
import {Role} from "./Role";
import {FormRoles} from "./FormRoles";

@Table
export class Form extends Model<Form> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    id: string;

    @CreatedAt
    createdOn: Date;

    @Column
    createdBy: string;

    @BelongsToMany(() => Role, () => FormRoles, 'formId', "roleId")
    roles: Role[];
}
