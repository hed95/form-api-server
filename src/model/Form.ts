import {BelongsToMany, Column, CreatedAt, DataType, HasMany, Model, Table} from 'sequelize-typescript';
import {FormComment} from './FormComment';
import {FormRoles} from './FormRoles';
import {Role} from './Role';

@Table
export class Form extends Model<Form> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @CreatedAt
    public createdOn: Date;

    @Column
    public createdBy: string;

    @BelongsToMany(() => Role, () => FormRoles, 'formId', 'roleId')
    public roles: Role[];

    @HasMany(() => FormComment)
    public comments: FormComment[];
}
