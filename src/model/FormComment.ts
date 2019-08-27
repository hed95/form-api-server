import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {ApiModel, ApiModelProperty} from 'swagger-express-ts';
import {Form} from './Form';

@ApiModel({
    description: 'Comment associated with a form',
    name: 'FormComment',
})
@Table({
    timestamps: false,
    tableName: 'formcomment',
})
export class FormComment extends Model<FormComment> {

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
        description: 'Created date. Optional. This can be left out',
        type: 'string',
        format: 'YYYY-MM-DDTHH:mm:ss.sssZ',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        field: 'createdon',
    })
    public createdOn: Date;

    @ApiModelProperty({
        description: 'Created by usually email address. If one is not provided then will use the caller\'s details',
        example: ['someone@domain.com'],
    })
    @Column({
        field: 'createdby',
    })
    public createdBy: string;

    @ApiModelProperty({
        description: 'Comment',
    })
    @Column({
        type: DataType.TEXT,
    })
    public comment: string;

    @ForeignKey(() => Form)
    @Column({
        type: DataType.UUID,
        field: 'formid',
    })
    public formId: string;

    @BelongsTo(() => Form)
    public form: Form;
}
