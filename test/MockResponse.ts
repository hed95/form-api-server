export class MockResponse {

    private jsonData: object;
    private statusData: number;
    private locationData: string;
    private headers: object = {};

    public json(data: object): MockResponse {
        this.jsonData = data;
        return this;
    }

    public send(data: object): MockResponse {
        this.jsonData = data;
        return this;
    }

    public status(status: number): MockResponse {
        this.statusData = status;
        return this;
    }

    public getJsonData() {
        return this.jsonData;
    }

    public getStatus() {
        return this.statusData;
    }

    public location(location: string) {
        this.locationData = location;
        return this;
    }

    public getLocation() : string {
        // @ts-ignore
        return this.locationData ? this.locationData : this.headers['Location'];
    }
    public sendStatus(status: number) {
        this.statusData = status;
        return this;
    }

    public setHeader(name: string, value: string) {
        // @ts-ignore
        this.headers[name] = value;
        return this;
    }
}
