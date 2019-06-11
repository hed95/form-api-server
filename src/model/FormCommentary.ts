import {Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Form} from './Form';
import {FormComment} from './FormComment';

@Table
export class FormCommentary extends Model<FormCommentary> {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @ForeignKey(() => Form)
    @Column
    public formId: string;

    @ForeignKey(() => FormComment)
    @Column
    public commentId: string;
}
