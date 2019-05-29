import {ApplicationContext} from "../../src/ioc/ApplicationContext";
import TYPE from "../../src/constant/TYPE";
import {expect} from 'chai';
import {FormService} from "../../src/service/FormService";

describe("FormService", () => {
    let applicationContext: ApplicationContext;
    beforeEach(() => {
        applicationContext = new ApplicationContext();
    });

    it('appcontext loads service and repository', async () => {
        const formService: FormService = applicationContext.get(TYPE.FormService);
        expect(formService).to.be.not.null;
        expect(formService.getFormRepository()).to.be.not.null;
        expect(formService.getFormRepository().name).to.be.eq('Form');
    });

    it ('can create a form, role and version', async () => {
        const formService: FormService = applicationContext.get(TYPE.FormService);
        await formService.create({});
    });

    it ('can create multiple versions', () => {

    });

});
