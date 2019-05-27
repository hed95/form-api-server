import {Column, CreatedAt, DataType, Model, Table} from "sequelize-typescript";

@Table
export class Form extends Model<Form>{
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
}
