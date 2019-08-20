import 'reflect-metadata';
import {expect} from "chai";
import {PDFService} from "../../../src/service/PDFService";
import {PDFController} from "../../../src/controller";
import {User} from "../../../src/auth/User";
import {Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {PdfRequest} from "../../../src/model/PdfRequest";
import {MockResponse} from "../../MockResponse";

describe('PDFController', () => {
    let pdfService: SubstituteOf<PDFService>;
    let pdfController: PDFController;
    let mockResponse: any;
    let user: User;

    beforeEach(() => {
        mockResponse = new MockResponse();
        pdfService = Substitute.for<PDFService>();
        pdfController = new PDFController(pdfService);
        user = new User('id', 'id', []);
    });

    it('can return accepted', async () => {

        const pdfRequest = new PdfRequest('webhook', {
            data: {
                test: 'test'
            }
        }, {
            name: 'test',
            path: 'test',
            title: 'test'
        });

        await pdfController.pdf(pdfRequest, mockResponse,
            user, 'formId');

        expect(mockResponse.getStatus()).to.be.eq(202);

    });

    it('can return accepted', async () => {

        const pdfRequest = new PdfRequest('webhook', {
            data: {
                test: 'test'
            }
        }, {
            name: 'test',
            path: 'test',
            title: 'test'
        });

        await pdfController.pdfWithJson(pdfRequest, mockResponse,
            user);

        expect(mockResponse.getStatus()).to.be.eq(202);

    });

});
