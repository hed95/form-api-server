import {Column, CreatedAt, DataType, Model, Table} from "sequelize-typescript";
import {ApiModel, ApiModelProperty} from "swagger-express-ts";

@ApiModel({
    description: "Comment associated with a form",
    name: "FormComment"
})
@Table
export class FormComment extends Model<FormComment> {

    @ApiModelProperty({
        description: "Auto generated UUID",
        type: "string",
        format: "uuid"
    })
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    id: string;

    @ApiModelProperty({
        description: "Created date. Optional. This can be left out",
        type: "string",
        format: "YYYY-MM-DDTHH:mm:ss.sssZ",
        required: false
    })
    @CreatedAt
    createdOn: Date;

    @ApiModelProperty({
        description: "Created by usually email address. If one is not provided then will use the caller's details",
        example :['someone@domain.com']
    })
    @Column
    createdBy: string;

    @ApiModelProperty({
        description: "Comment"
    })
    @Column
    comment: string;
}
