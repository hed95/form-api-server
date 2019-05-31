import * as Joi from '@hapi/joi'
import {ValidationResult} from '@hapi/joi'
import {provide} from "inversify-binding-decorators";
import TYPE from "../constant/TYPE";

@provide(TYPE.FormSchemaValidator)
export class FormSchemaValidator {

    private schema(): object {
        return Joi.object().keys({
            name: Joi.string().required(),
            title: Joi.string().required(),
            path: Joi.string().required()
        })
    }


    public validate(payload: object): ValidationResult<object> {
        return Joi.validate(payload, this.schema(), {
            abortEarly: false
        });
    }
}
