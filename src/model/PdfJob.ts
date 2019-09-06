export class PdfJob {

    public readonly formSchema: any;
    public readonly submission: object;
    public readonly webhookUrl: string;
    public readonly formUrl: string;

    constructor(formSchema: any,
                submission: object,
                webhookUrl: string,
                formUrl?: string) {
        this.formSchema = formSchema;
        this.submission = submission;
        this.webhookUrl = webhookUrl;
        this.formUrl = formUrl;
    }

}
