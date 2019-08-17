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
import ResourceValidationError from '../error/ResourceValidationError';
import {PdfSubmission} from '../model/PdfSubmission';

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
    public async pdf(@requestParam('formId') formId: string,
                     @requestBody() pdfData: PdfSubmission, @response() res: express.Response,
                     @principal() currentUser: User): Promise<void> {
        if (!pdfData.webhookUrl || pdfData.webhookUrl === '') {
            throw new ResourceValidationError('Failed validation', [{
                type: 'missing',
                message: 'Webhook URL required for pdf generation',
                path: ['webhookUrl'],
            }]);
        }
        await this.pdfService.generatePDF(formId, currentUser, pdfData.webhookUrl, pdfData.submission);
        res.sendStatus(HttpStatus.ACCEPTED);
    }

}
