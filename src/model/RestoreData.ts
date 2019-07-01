export class RestoreData {
    public readonly formId: string;
    public readonly versionId: string;

    constructor(formId: string, versionId: string) {
        this.formId = formId;
        this.versionId = versionId;
    }

}
