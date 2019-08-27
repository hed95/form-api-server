import {Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Form} from './Form';
import {Role} from './Role';

@Table({
    tableName: 'formroles',
    timestamps: false
})
export class FormRoles extends Model<FormRoles> {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @ForeignKey(() => Form)
    @Column({
        type: DataType.UUID,
        field: 'formid'
    })
    public formId: string;

    @ForeignKey(() => Role)
    @Column({
        type: DataType.UUID,
        field : 'roleid'
    })
    public roleId: string;
}
