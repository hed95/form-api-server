import {Op} from 'sequelize';
import {AllowNull, Column, DataType, Length, Model, Table} from 'sequelize-typescript';

@Table
export class Role extends Model<Role> {

    public static async defaultRole(): Promise<Role> {
        const defaultRoleName = process.env.DEFAULT_ROLE || 'anonymous';
        return await Role.findOne({
            where: {
                name: {
                    [Op.eq]: defaultRoleName,
                },
            },
        });
    }

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    public id: string;

    @AllowNull(false)
    @Length({min: 1, max: 40, msg: 'name must have length greater than 1 and less than 40'})
    @Column({
        unique: true,
    })
    public name: string;

    @Column
    public description: string;

    @Column
    public active: boolean;

}
