import {AllowNull, Column, DataType, Length, Model, Table} from "sequelize-typescript";

@Table
export class Role extends Model<Role> {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    id: string;

    @AllowNull(false)
    @Length({min: 1, max: 40, msg: 'name must have length greater than 1 and less than 40'})
    @Column({
        unique: true
    })
    name: string;

    @Column
    description: string;

    @Column
    active: boolean;

}
