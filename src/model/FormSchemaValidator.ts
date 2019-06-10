import * as Joi from '@hapi/joi'
import {ValidationResult} from '@hapi/joi'
import {provide} from "inversify-binding-decorators";
import TYPE from "../constant/TYPE";

@provide(TYPE.FormSchemaValidator)
export class FormSchemaValidator {

    private schema(): object {
        return Joi.object().keys({
            _id: Joi.string(),
            name: Joi.string().required(),
            title: Joi.string().required(),
            path: Joi.string().required(),
            components: Joi.any().allow(),
            type: Joi.string().required(),
            tags: Joi.array().items(Joi.string()).allow(),
            owner: Joi.string().allow(),
            display: Joi.string().valid("form", "wizard", "pdf"),
            access: Joi.array().items(Joi.any()),
            submissionAccess: Joi.array().items(Joi.any())
        })
    }


    public validate(payload: object): ValidationResult<object> {
        return Joi.validate(payload, this.schema(), {
            abortEarly: false,
        });
    }
}
