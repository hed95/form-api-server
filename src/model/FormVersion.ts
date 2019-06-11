import {AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table, UpdatedAt} from 'sequelize-typescript';
import {Form} from './Form';

@Table
export class FormVersion extends Model<FormVersion> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @AllowNull(false)
    @Column
    public name: string;

    @AllowNull(false)
    @Column
    public title: string;

    @Column
    public path: string;

    @UpdatedAt
    public updatedOn: Date;

    @Column
    public updatedBy: string;

    @AllowNull(false)
    @Column({
        type: DataType.JSON,
    })
    public schema: object;

    @Column({comment: ''})
    public validFrom: Date;

    @Column({comment: 'if validTo is null then this is the latest version of the form'})
    public validTo: Date;

    @BelongsTo(() => Form)
    public form?: Form;

    @ForeignKey(() => Form)
    @Column
    public formId: string;

    @Column
    public latest: boolean;

}
