import puppeteer from 'puppeteer';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import InternalServerError from '../error/InternalServerError';
import ResourceValidationError from '../error/ResourceValidationError';
import {User} from '../auth/User';
import {inject} from 'inversify';
import {FormService} from './FormService';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';
import {FormTemplateResolver} from '../pdf/FormTemplateResolver';

@provide(TYPE.PDFService)
export class PDFService {

    private readonly formService: FormService;
    private readonly formTemplateResolver: FormTemplateResolver;

    constructor(@inject(TYPE.FormService) formService: FormService,
                @inject(TYPE.FormTemplateResolver) formTemplateResolver: FormTemplateResolver) {
        this.formService = formService;
        this.formTemplateResolver = formTemplateResolver;
    }

    public async generatePDF(formId: string, currentUser: User, submission?: object) {
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
        const formName = formVersion.schema.name;
        logger.info(`${currentUser.details.email} has requested to generate PDF of form ${formName}`);
        const browser = await puppeteer.launch({headless: false});
        logger.debug('Opened browser for creating PDF');
        try {

            const htmlContent = await this.formTemplateResolver.renderContentAsHtml(formVersion.schema,
                submission, currentUser);
            const page = await browser.newPage();
            await page.setContent(htmlContent, {waitUntil: ['networkidle0', 'load', 'domcontentloaded']});
            return await page.pdf({format: 'A4'});
        } catch (e) {
            logger.error('An exception occurred', e.message);
            throw new InternalServerError(`Failed to PDF, Error: ${JSON.stringify(e)}`);
        } finally {
            if (browser !== null) {
                await browser.close();
                logger.debug('Browser closed');
            }
        }

    }
}
