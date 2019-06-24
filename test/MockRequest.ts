export class MockRequest {
    private readonly path: string;
    private readonly baseUrl: string;

    public constructor(path: string, baseUrl: string) {
        this.path = path;
        this.baseUrl = baseUrl;
    }


    public kauth: any = {
        grant: {
            'access_token': {
                content: {
                    realm_access: {
                        roles: ['test']
                    }
                }
            }
        }
    }

}
