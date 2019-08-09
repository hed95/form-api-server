import {expect} from "chai";
import {applicationContext} from "../setup-test";
import TYPE from "../../../src/constant/TYPE";
import {FormTemplateResolver} from "../../../src/pdf/FormTemplateResolver";
import logger from "../../../src/util/logger";
import {basicForm} from "../../form";
import {User} from "../../../src/auth/User";

describe('FormTemplateResolver', () => {
    const formTemplateResolver: FormTemplateResolver = applicationContext.get(TYPE.FormTemplateResolver);

    it('can generate html', async () => {
        const user = new User("id", "test", []);
        const result = await formTemplateResolver.renderContentAsHtml(basicForm, {
            data: {
                "textField": "This is a test of data"
            }
        }, user);
        expect(result).to.be.not.null;
    });
});
