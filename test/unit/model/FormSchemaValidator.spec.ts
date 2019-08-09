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
    });

    it('invalid if keys are same', () =>{
        const payload : object = {
            name: "A",
            path: "A",
            title: "A",
            components: [{
                input: 'textField',
                key:'A'
            }, {
                input: 'textField',
                key: 'A'
            }]
        };

        const result: ValidationResult<object> = validator.validate(payload);
        expect(result.error).to.be.not.null;
        expect(result.error.details.length).to.be.eq(1);
        expect(result.error.details[0].message).to.be.eq('Component keys must be unique: A')
    });
});
