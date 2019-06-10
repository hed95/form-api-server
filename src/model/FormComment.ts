import {Column, CreatedAt, DataType, Model, Table} from "sequelize-typescript";

@Table
export class FormComment extends Model<FormComment> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    id: string;

    @CreatedAt
    createdOn: Date;

    @Column
    createdBy: string;

    @Column
    comment: string;
}
