import {AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table, UpdatedAt} from 'sequelize-typescript';
import {Form} from './Form';

@Table
export class FormVersion extends Model<FormVersion> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public versionId: string;

    @UpdatedAt
    public updatedOn: Date;

    @Column
    public createdBy: string;

    @AllowNull(false)
    @Column({
        type: DataType.JSONB,
    })
    public schema: object;

    @Column({comment: ''})
    public validFrom: Date;

    @Column({comment: 'if validTo is null then this is the latest version of the form'})
    public validTo: Date;

    @BelongsTo(() => Form)
    public form?: Form;

    @ForeignKey(() => Form)
    @Column({
        type: DataType.UUID,
    })
    public formId: string;

    @Column
    public latest: boolean;
}
