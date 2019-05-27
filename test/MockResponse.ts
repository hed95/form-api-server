export class MockResponse {

    private jsonData: object;

    public json(data: object): void {
        this.jsonData = data;
    }

    public getJsonData() {
        return this.jsonData;
    }
}
