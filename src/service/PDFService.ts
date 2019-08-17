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

@provide(TYPE.PDFService)
export class PDFService {

    private readonly formService: FormService;
    private readonly pdfQueue: Queue<PdfJob>;

    constructor(@inject(TYPE.FormService) formService: FormService,
                @inject(TYPE.PDFQueue) pdfQueue: Queue<PdfJob>) {
        this.formService = formService;
        this.pdfQueue = pdfQueue;
    }

    public async generatePDF(formId: string, currentUser: User,
                             webhookUrl: string,
                             submission?: object): Promise<void> {
        if (!formId) {
            throw new ResourceValidationError('Form Id required', [{
                message: 'Form id required',
                type: 'missing form id',
                path: ['formId'],
            }]);
        }
        const formVersion: FormVersion = await this.formService.findForm(formId, currentUser);
        if (!formVersion) {
            throw new ResourceNotFoundError(`Form ${formId} does not exist`);
        }
        logger.debug(`PDF request submitted for processing`);
        await this.pdfQueue.add(new PdfJob(formVersion.schema, submission, webhookUrl));
    }
}
