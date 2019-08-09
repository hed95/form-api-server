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
import * as fs from 'fs';
import moment from 'moment';

@provide(TYPE.PDFService)
export class PDFService {

    private readonly formService: FormService;
    private readonly formTemplateResolver: FormTemplateResolver;

    constructor(@inject(TYPE.FormService) formService: FormService,
                @inject(TYPE.FormTemplateResolver) formTemplateResolver: FormTemplateResolver) {
        this.formService = formService;
        this.formTemplateResolver = formTemplateResolver;
    }

    public async generatePDF(formId: string, currentUser: User, submission?: object): Promise<[string, any]> {
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
        const browser = await puppeteer.launch({headless: true, args: ['--disable-web-security', '--no-sandbox']});
        const page = await browser.newPage();

        logger.debug('Opened browser for creating PDF');

        const fileName = `/tmp/form-${formName}-${moment().toDate().getTime()}.html`;

        try {
            const htmlContent = await this.formTemplateResolver.renderContentAsHtml(formVersion.schema,
                submission, currentUser);

            const result = await this.writeFilePromise(fileName, htmlContent);
            logger.info(`${result}`);

            await page.goto(`file://${fileName}`, {waitUntil: ['networkidle0', 'load', 'domcontentloaded']});
            const pdf = await page.pdf({format: 'A4'});
            return Promise.resolve([formName, pdf]);
        } catch (e) {
            logger.error('An exception occurred', e.message);
            throw new InternalServerError(`Failed to PDF, Error: ${JSON.stringify(e)}`);
        } finally {
            if (page !== null) {
                await page.close();
            }
            if (browser !== null) {
                await browser.close();
                logger.debug('Browser closed');
            }
            const output = await this.deleteFile(fileName);
            logger.debug(`${output}`);
        }
    }

    private deleteFile(file: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.unlink(file, error => {
                if (error) reject(error);
                resolve(`file ${file} successfully deleted`);
            });
        });
    };

    private writeFilePromise(file: string, data: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, data, error => {
                if (error) reject(error);
                resolve(`${file} successfully created`);
            });
        });
    };
}
