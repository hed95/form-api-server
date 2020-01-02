import {ApplicationContext} from "../../../src/container/ApplicationContext";
import {expect} from 'chai';
import TYPE from "../../../src/constant/TYPE";
import {register} from "prom-client";

describe("ApplicationContext", () => {
    it('can create applicationcontext', () => {
        register.clear();
        const applicationContext: ApplicationContext = new ApplicationContext();
        expect(applicationContext.get(TYPE.FormVersionRepository)).to.be.not.null;
        expect(applicationContext.iocContainer()).to.be.not.null;
    });
});
