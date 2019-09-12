import {expect} from "chai";
import {ValidationService} from "../../../src/service/ValidationService";
import {FormService} from "../../../src/service/FormService";
import {Arg, Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {User} from "../../../src/auth/User";
import {FormVersion} from "../../../src/model/FormVersion";
import {basicForm, dataGridForm, emailForm, numberForm} from "../../form";
import {KeycloakService} from "../../../src/auth/KeycloakService";

describe('Validation Service', () => {
    let formService: SubstituteOf<FormService>;
    let underTest: ValidationService;
    let keycloakService: SubstituteOf<KeycloakService>;

    beforeEach(() => {
        formService = Substitute.for<FormService>();
        keycloakService = Substitute.for<KeycloakService>()
        underTest = new ValidationService(formService, keycloakService);

    });
    it('can validate simple text field', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = basicForm;
        keycloakService.token().returns('token');
        formService.findLatestForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        const result = await underTest.validate("formId", {
            "data" : {
                "textField" : null

            }
        }, user);

       expect(result.length).to.be.eq(1);
    });

    it('validation successful', async () => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = basicForm;
        formService.findLatestForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

        const result = await underTest.validate("formId", {
            data: {
                textField: 'xxxx'
            }
        }, user);

        expect(result.length).to.be.eq(0);
    });

    it('can validate number field', async() => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = numberForm;
        formService.findLatestForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

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
        formService.findLatestForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

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
        formService.findLatestForm(Arg.any(), Arg.any()).returns(Promise.resolve(version));

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
    });
});
