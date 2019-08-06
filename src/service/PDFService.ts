import puppeteer from 'puppeteer';
import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import * as fs from 'fs';
import InternalServerError from '../error/InternalServerError';
import ResourceValidationError from '../error/ResourceValidationError';
import {User} from '../auth/User';
import {inject} from 'inversify';
import {FormService} from './FormService';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormVersion} from '../model/FormVersion';
import logger from '../util/logger';

@provide(TYPE.PDFService)
export class PDFService {

    private readonly formService: FormService;

    constructor(@inject(TYPE.FormService) formService: FormService) {
        this.formService = formService;
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
        const browser = await puppeteer.launch({headless: true});
        try {
            const page = await browser.newPage();
            const contentHtml = fs.readFileSync('/Users/aminmc/Downloads/test.html', 'utf8');
            await page.setContent(contentHtml, {waitUntil: ['networkidle0', 'load', 'domcontentloaded']});
            const pdf = await page.pdf({format: 'A4'});
            await browser.close();
            return pdf;
        } catch (e) {
            throw new InternalServerError(`Failed to PDF, Error: ${JSON.stringify(e)}`);
        } finally {
            if (browser !== null) {
                await browser.close();
            }
        }

    }
}
