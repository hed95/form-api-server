export class PdfRequest {
    public webhookUrl: string;
    public submission: object;
    public schema: object;

    constructor(webHookUrl: string, submission: object, schema: object) {
        this.webhookUrl = webHookUrl;
        this.submission = submission;
        this.schema = schema;
    }
}
