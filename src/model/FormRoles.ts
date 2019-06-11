import {Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Form} from './Form';
import {Role} from './Role';

@Table
export class FormRoles extends Model<FormRoles> {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @ForeignKey(() => Form)
    @Column
    public formId: string;

    @ForeignKey(() => Role)
    @Column
    public roleId: string;
}
