import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import Handlebars from 'handlebars';
import template from './formTemplate';
import {User} from '../auth/User';

@provide(TYPE.FormTemplateResolver)
export class FormTemplateResolver {

    public async renderContentAsHtml(formSchema: object, submission: object, user: User): Promise<string> {
        const sanitizedFormSchema = this.sanitize(formSchema);
        Handlebars.registerHelper('json', (context) => {
            return JSON.stringify(context);
        });
        const content = Handlebars.compile(template);
        const parsedContent = content({
            formSchema: sanitizedFormSchema,
            submission,
            user: user.details.email,
        }, {});
        return Promise.resolve(parsedContent);
    }

    private sanitize(formSchema: object): object {
        // @ts-ignore

        return formSchema;
    }
}
