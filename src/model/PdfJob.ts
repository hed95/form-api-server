export class PdfJob {

    public readonly formSchema: any;
    public readonly submission: object;
    public readonly webhookUrl: string;

    constructor(formSchema: any,
                submission: object,
                webhookUrl: string) {
        this.formSchema = formSchema;
        this.submission = submission;
        this.webhookUrl = webhookUrl;
    }

}
