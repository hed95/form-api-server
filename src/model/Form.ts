import {BelongsToMany, Column, DataType, HasMany, Model, Table} from 'sequelize-typescript';
import {FormComment} from './FormComment';
import {FormRoles} from './FormRoles';
import {Role} from './Role';

@Table({
    timestamps: false,
})
export class Form extends Model<Form> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @Column({
        type: DataType.DATE,
    })
    public createdOn: Date;

    @Column({
        type: DataType.DATE,
    })
    public updatedOn: Date;

    @Column
    public createdBy: string;

    @Column
    public updatedBy: string;

    @BelongsToMany(() => Role, () => FormRoles, 'formId', 'roleId')
    public roles: Role[];

    @HasMany(() => FormComment)
    public comments: FormComment[];
}
