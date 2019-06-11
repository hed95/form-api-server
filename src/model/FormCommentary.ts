import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Form} from './Form';
import {FormComment} from './FormComment';

@Table
export class FormCommentary extends Model<FormCommentary> {

    @ForeignKey(() => Form)
    @Column
    public formId: string;

    @ForeignKey(() => FormComment)
    @Column
    public commentId: string;
}
