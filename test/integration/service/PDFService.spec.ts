import {expect} from 'chai';
import {PDFService} from "../../../src/service/PDFService";
import {FormService} from "../../../src/service/FormService";
import {applicationContext} from "../setup-test";
import TYPE from "../../../src/constant/TYPE";

describe('PDFService', () => {
    const formService: FormService = applicationContext.get(TYPE.FormService);
    const pdfService: PDFService = applicationContext.get(TYPE.PDFService);

    it('can generate pdf', (done) => {
        done();
    });
});
