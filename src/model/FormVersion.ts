import {AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Form} from './Form';
import {ApiModel, ApiModelProperty} from 'swagger-express-ts';

@ApiModel({
    description: 'Database representation of a Form stored in the API Server',
    name: 'FormVersion',
})
@Table({
    timestamps: false,
})
export class FormVersion extends Model<FormVersion> {

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
    public versionId: string;

    @ApiModelProperty({
        description: 'Date on which this entity was created',
        type: 'string',
        format: 'string',
    })
    @Column({
        type: DataType.DATE,
    })
    public createdOn: Date;

    @ApiModelProperty({
        description: 'User who created this form version',
        type: 'string',
        format: 'string',
    })
    @Column
    public createdBy: string;

    @ApiModelProperty({
        description: 'User who last updated this form version',
        type: 'string',
        format: 'string',
    })
    @Column
    public updatedBy: string;

    @ApiModelProperty({
        description: 'JSON representation of form',
        type: 'object',
        format: 'string',
    })
    @AllowNull(false)
    @Column({
        type: DataType.JSONB,
    })
    public schema: any;

    @ApiModelProperty({
        description: 'Valid from date',
        type: 'string',
        format: 'string',
    })
    @Column({comment: ''})
    public validFrom: Date;

    @ApiModelProperty({
        description: 'Valid from to',
        type: 'string',
        format: 'string',
    })
    @Column({comment: 'if validTo is null then this is the latest version of the form'})
    public validTo: Date;

    @BelongsTo(() => Form)
    public form?: Form;

    @ApiModelProperty({
        description: 'Form id, this allows multiple versions to be created against a single form entity',
        type: 'string',
        format: 'string',
    })
    @ForeignKey(() => Form)
    @Column({
        type: DataType.UUID,
    })
    public formId: string;

    @ApiModelProperty({
        description: 'Latest form indicator',
        type: 'string',
        format: 'string',
    })
    @Column
    public latest: boolean;
}
