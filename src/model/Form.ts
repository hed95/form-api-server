import {BelongsToMany, Column, CreatedAt, DataType, HasMany, Model, Table} from 'sequelize-typescript';
import {FormComment} from './FormComment';
import {FormRoles} from './FormRoles';
import {Role} from './Role';

@Table({
    timestamps: false,
    tableName: 'form',
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
        field: 'createdon',
    })
    @CreatedAt
    public createdOn: Date;

    @Column({
        type: DataType.DATE,
        field: 'updatedon',
    })
    public updatedOn: Date;

    @Column({
        field: 'createdby',
    })
    public createdBy: string;

    @Column({
        field: 'updatedby',
    })
    public updatedBy: string;

    @BelongsToMany(() => Role, () => FormRoles, 'formId', 'roleId')
    public roles: Role[];

    @HasMany(() => FormComment)
    public comments: FormComment[];
}
