export class MockResponse {

    private jsonData: object;
    private statusData: number;
    private locationData: string;

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
        return this.locationData;
    }
}
