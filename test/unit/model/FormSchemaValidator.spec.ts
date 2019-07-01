import 'reflect-metadata';
import {FormSchemaValidator} from "../../../src/model/FormSchemaValidator";
import {expect} from "chai";
import {ValidationResult} from "@hapi/joi";

describe("FormSchemaValidator", () => {
    const validator = new FormSchemaValidator();
    it('can validate', () => {
        const payload : object = {
            name: null,
            path: null,
            title: null
        };

        const result: ValidationResult<object> = validator.validate(payload);
        expect(result.error).to.be.not.null;
        expect(result.error.details.length).to.be.eq(3);
    })
});
