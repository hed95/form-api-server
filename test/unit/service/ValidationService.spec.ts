import {expect} from "chai";
import {ValidationService} from "../../../src/service/ValidationService";
import {FormService} from "../../../src/service/FormService";
import {Arg, Substitute} from "@fluffy-spoon/substitute";
import {User} from "../../../src/auth/User";
import {FormVersion} from "../../../src/model/FormVersion";
import {basicForm, dataGridForm, emailForm, numberForm} from "../../form";

describe('Validation Service', () => {
    let formService: FormService;
    let underTest: ValidationService;

    beforeEach(() => {
        formService = Substitute.for<FormService>();
        underTest = new ValidationService(formService);

    });
    it('can validate simple text field', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = basicForm;
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        const result = await underTest.validate("formId", {
            data: {
                textField: null
            }
        }, user);

       expect(result.length).to.be.eq(1);
    });

    it('can validate number field', async() => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = numberForm;
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        const result = await underTest.validate("formId", {
            data: {
                number: 'hello'
            }
        }, user);

        expect(result.length).to.be.eq(1);
    });

    it('can validate email', async() => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = emailForm;
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        const result = await underTest.validate("formId", {
            data: {
                email: 'hello'
            }
        }, user);

        expect(result.length).to.be.eq(1);
    });

    it('can validate data grid', async() => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = dataGridForm;
        // @ts-ignore
        formService.findForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        const result = await underTest.validate("formId", {
            data: {
                data: [
                    {
                        field: ''
                    }
                ]
            }
        }, user);

        expect(result.length).to.be.eq(1);
    })
});
