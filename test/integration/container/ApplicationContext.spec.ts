import {ApplicationContext} from "../../../src/container/ApplicationContext";
import {expect} from 'chai';
import TYPE from "../../../src/constant/TYPE";

describe("ApplicationContext", () => {
    it('can create applicationcontext', () => {
        const applicationContext: ApplicationContext = new ApplicationContext();
        expect(applicationContext.get(TYPE.FormVersionRepository)).to.be.not.null;
        expect(applicationContext.iocContainer()).to.be.not.null;
    });
});
