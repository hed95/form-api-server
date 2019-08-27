import {AllowNull, Column, DataType, Length, Model, Table} from 'sequelize-typescript';
import {ApiModel, ApiModelProperty} from 'swagger-express-ts';

@ApiModel({
    description: 'Role defined in API Server. Use to access control a form',
    name: 'Role',
})
@Table({
    freezeTableName: true,
    tableName: 'role',
    timestamps: false
})
export class Role extends Model<Role> {

    @ApiModelProperty({
        description: 'Auto generated UUID',
        type: 'string',
        format: 'uuid',
    })
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @ApiModelProperty({
        description: 'Name of role',
        type: 'string',
        format: 'string',
    })
    @AllowNull(false)
    @Length({min: 1, max: 40, msg: 'name must have length greater than 1 and less than 40'})
    @Column({
        unique: true,
    })
    public name: string;

    @ApiModelProperty({
        description: 'Role description',
        type: 'string',
        format: 'string',
    })
    @Column
    public description: string;

    @ApiModelProperty({
        description: 'If role is currently active or not',
        type: 'string',
        format: 'boolean',
    })
    @Column
    public active: boolean;

}
