export default class KeycloakContext {

    private readonly accessToken: string;
    private readonly refreshToken: string;
    private readonly content: any;
    private readonly sessionId: string;
    private readonly email: string;
    private readonly userName: string;
    private readonly givenName: string;
    private readonly familyName: string;
    private  correlationId: string;

    constructor(kauth: any) {
        this.accessToken = kauth.grant.access_token.token;
        this.refreshToken = kauth.grant.refresh_token ? kauth.grant.refresh_token.token : null;
        const content = kauth.grant.access_token.content;
        this.sessionId = content.session_state;
        this.email = content.email;
        this.userName = content.preferred_username;
        this.givenName = content.given_name;
        this.familyName = content.family_name;
    }

    public setCorrelationId(correlationId: string): void {
        this.correlationId = correlationId;
    }

    public getCorrelationId() {
        return this.correlationId;
    }
}
