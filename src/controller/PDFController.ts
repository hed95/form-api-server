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
                     @requestBody() submission: object, @response() res: express.Response,
                     @principal() currentUser: User): Promise<void> {
        const [formName, pdf] = await this.pdfService.generatePDF(formId, currentUser, submission);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdf.length);
        res.setHeader('Content-Disposition', `attachment; filename=${formName}.pdf`);
        res.send(pdf);
    }

}
