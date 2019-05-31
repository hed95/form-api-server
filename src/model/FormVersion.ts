import {AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table, UpdatedAt} from "sequelize-typescript";
import {Form} from "./Form";

@Table
export class FormVersion extends Model<FormVersion> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    id: string;

    @AllowNull(false)
    @Column
    name: string;

    @AllowNull(false)
    @Column
    title: string;

    @Column
    path: string;

    @UpdatedAt
    updatedOn: Date;

    @Column
    updatedBy: string;

    @AllowNull(false)
    @Column({
        type: DataType.JSON
    })
    schema: object;

    @Column({comment: ""})
    validFrom: Date;

    @Column({comment: "if validTo is null then this is the latest version of the form"})
    validTo: Date;

    @BelongsTo(() => Form)
    form?: Form;

    @ForeignKey(() => Form)
    @Column
    formId: string;

    @Column
    latest: boolean;

}
