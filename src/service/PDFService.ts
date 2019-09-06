import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import ResourceValidationError from '../error/ResourceValidationError';
import {User} from '../auth/User';
import {inject} from 'inversify';
import {FormService} from './FormService';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormVersion} from '../model/FormVersion';
import {Queue} from 'bull';
import logger from '../util/logger';
import {PdfJob} from '../model/PdfJob';
import {PdfRequest} from '../model/PdfRequest';

@provide(TYPE.PDFService)
export class PDFService {

    private readonly formService: FormService;
    private readonly pdfQueue: Queue<PdfJob>;

    constructor(@inject(TYPE.FormService) formService: FormService,
                @inject(TYPE.PDFQueue) pdfQueue: Queue<PdfJob>) {
        this.formService = formService;
        this.pdfQueue = pdfQueue;
    }

    public async generatePDF(currentUser: User,
                             pdfRequest: PdfRequest, formId?: string): Promise<void> {

        if (!pdfRequest.webhookUrl || pdfRequest.webhookUrl === '') {
            throw new ResourceValidationError('Failed validation', [{
                type: 'missing',
                message: 'Webhook URL required for pdf generation',
                path: ['webhookUrl'],
            }]);
        }
        const schema = pdfRequest.schema;
        const submission = pdfRequest.submission;
        const webHookUrl = pdfRequest.webhookUrl;

        if (!formId && !pdfRequest.schema && !pdfRequest.formUrl) {
            throw new ResourceValidationError('Form Id required', [{
                message: 'Form id , schema or formUrl required',
                type: 'missing form id or schema',
                path: ['formId', 'schema', 'formUrl'],
            }]);
        }
        const schemaToPdf = formId ? await this.getForm(formId, currentUser) : schema;
        logger.debug(`PDF request submitted for processing`);
        await this.pdfQueue.add(new PdfJob(schemaToPdf,
            submission,
            webHookUrl,
            pdfRequest.formUrl),
            {attempts: 5, backoff: 5000});
    }

    private async getForm(formId: string, currentUser: User): Promise<object> {
        const formVersion: FormVersion =  await this.formService.findLatestForm(formId, currentUser);
        if (!formVersion) {
            throw new ResourceNotFoundError(`Form ${formId} does not exist`);
        }
        return formVersion.schema;
    }
}
