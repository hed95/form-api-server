export class PdfRequest {
    public webhookUrl: string;
    public submission: object;
    public schema: object;
    public formUrl: string;

    constructor(webHookUrl: string, submission: object, schema: object, formUrl?: string) {
        this.webhookUrl = webHookUrl;
        this.submission = submission;
        this.schema = schema;
        this.formUrl = formUrl;
    }
}
