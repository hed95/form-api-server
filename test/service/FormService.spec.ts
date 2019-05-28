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
        const formService: FormService = applicationContext.iocContainer().get(TYPE.FormService);
        expect(formService).to.be.not.null;
        expect(formService.getFormRepository()).to.be.not.null;
        expect(formService.getFormRepository().name).to.be.eq('Form');
    });
});
