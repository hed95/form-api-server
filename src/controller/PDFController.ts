import {ApiPath} from 'swagger-express-ts';
import {
    BaseHttpController,
    controller,
    httpPost,
    principal,
    requestBody,
    requestParam,
    response,
} from 'inversify-express-utils';
import {inject} from 'inversify';
import TYPE from '../constant/TYPE';
import {PDFService} from '../service/PDFService';
import * as express from 'express';
import {User} from '../auth/User';
import HttpStatus from 'http-status-codes';
import {PdfRequest} from '../model/PdfRequest';

@ApiPath({
    path: '/pdf',
    name: 'PDF',
    description: 'API for generating PDFs',
    security: {bearerAuth: []},
})
@controller('/pdf')
export class PDFController extends BaseHttpController {
    constructor(@inject(TYPE.PDFService) private readonly pdfService: PDFService) {
        super();
    }

    @httpPost('/:formId', TYPE.ProtectMiddleware)
    public async pdf(@requestBody() pdfRequest: PdfRequest,
                     @response() res: express.Response,
                     @principal() currentUser: User,
                     @requestParam('formId') formId?: string): Promise<void> {

        await this.pdfService.generatePDF(currentUser, pdfRequest, formId);
        res.sendStatus(HttpStatus.ACCEPTED);
    }

    @httpPost('', TYPE.ProtectMiddleware)
    public async pdfWithJson(@requestBody() pdfRequest: PdfRequest,
                             @response() res: express.Response,
                             @principal() currentUser: User): Promise<void> {
        await this.pdfService.generatePDF(currentUser, pdfRequest);
        res.sendStatus(HttpStatus.ACCEPTED);
    }

}
