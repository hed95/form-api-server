import {AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Form} from './Form';

@Table({
    timestamps: false,
})
export class FormVersion extends Model<FormVersion> {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public versionId: string;

    @Column({
        type: DataType.DATE,
    })
    public createdOn: Date;

    @Column
    public createdBy: string;

    @Column
    public updatedBy: string;

    @AllowNull(false)
    @Column({
        type: DataType.JSONB,
    })
    public schema: any;

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
