import 'reflect-metadata';
import {expect} from "chai";
import {Arg, Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {FormService} from "../../../src/service/FormService";
import {Queue} from "bull";
import {PdfJob} from "../../../src/model/PdfJob";
import {PDFService} from "../../../src/service/PDFService";
import {User} from "../../../src/auth/User";
import {PdfRequest} from "../../../src/model/PdfRequest";
import ResourceValidationError from "../../../src/error/ResourceValidationError";
import ResourceNotFoundError from "../../../src/error/ResourceNotFoundError";
import {FormVersion} from "../../../src/model/FormVersion";

describe('PDFService', () => {
    let formService: SubstituteOf<FormService>;
    let pdfQueue: SubstituteOf<Queue<PdfJob>>;
    let pdfService: PDFService;

    beforeEach(() => {
        formService = Substitute.for<FormService>();
        pdfQueue = Substitute.for<Queue<PdfJob>>();
        pdfService = new PDFService(formService, pdfQueue);
    });

    it('throws Resource validation if both formid and schema missing', async () => {
        const user: User = new User('id', 'id', []);
        try {
            await pdfService.generatePDF(user, new PdfRequest('/webhookUrl', {}, null));
        } catch (err) {
            expect(err instanceof ResourceValidationError).to.be.eq(true);
        }
    });
    it('throws ResourceNotFoundError if service returns null', async() => {
        const user: User = new User('id', 'id', []);
        try {
            formService.findForm('formId', user).returns(Promise.resolve(null));
            await pdfService.generatePDF(user, new PdfRequest('/webhookUrl', {}, null), 'formId');
        } catch (err) {
            expect(err instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });
    it('Adds to queue when form loaded from service', async() => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };

        formService.findForm('formId', user).returns(Promise.resolve(version));
        await pdfService.generatePDF(user, new PdfRequest('/webhookUrl', {}, null), 'formId')
        // @ts-ignore
        pdfQueue.received(1).add(Arg.any())
    });
    it('Adds to queue if schema present', async() => {
        const user = new User("id", "email");
        Object.assign(FormVersion, {});
        const version: FormVersion = Object.assign(FormVersion.prototype, {});
        version.schema = {
            display: 'form',
            components: []
        };

        formService.findForm('formId', user).returns(Promise.resolve(version));
        await pdfService.generatePDF(user, new PdfRequest('/webhookUrl', {}, {
            name: 'name',
            components: []
        }));
        formService.didNotReceive(1).findForm(Arg.any(), Arg.any());
        // @ts-ignore
        pdfQueue.received(1).add(Arg.any())
    });
});
