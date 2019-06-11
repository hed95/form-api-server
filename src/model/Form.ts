import {BelongsToMany, Column, CreatedAt, DataType, Model, Table} from 'sequelize-typescript';
import {FormComment} from './FormComment';
import {FormCommentary} from './FormCommentary';
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

    @BelongsToMany(() => FormComment, () => FormCommentary, 'formId', 'commentId')
    public comments: FormComment[];
}
