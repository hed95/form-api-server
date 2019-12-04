import 'reflect-metadata';
// tslint:disable-next-line:no-implicit-dependencies
import {expect} from 'chai';
import {MockResponse} from '../../MockResponse';
import {KeycloakAuthProvider} from '../../../src/auth/KeycloakAuthProvider';
import AppConfig from '../../../src/interfaces/AppConfig';
// tslint:disable-next-line:no-implicit-dependencies
import {Substitute} from '@fluffy-spoon/substitute';
import {KeycloakService} from '../../../src/auth/KeycloakService';
import defaultAppConfig from '../../../src/config/defaultAppConfig';
import {MockRequest} from '../../MockRequest';
import {User} from '../../../src/auth/User';

describe('KeycloakAuthProvider', () => {

    let mockResponse: any;
    let mockRequest: any;
    let keycloakAuthProvider: KeycloakAuthProvider;
    let keycloakService: KeycloakService;
    let appConfig: AppConfig;

    beforeEach(() => {
        mockResponse = new MockResponse();
        keycloakService = Substitute.for<KeycloakService>();
        keycloakAuthProvider = new KeycloakAuthProvider();
        appConfig = defaultAppConfig;
        // @ts-ignore
        keycloakAuthProvider.keycloakService = keycloakService;
        // @ts-ignore
        keycloakAuthProvider.appConfig = appConfig;
    });
    it('returns null if CORS origin and METHOD is OPTIONS', async () => {
        // @ts-ignore
        keycloakAuthProvider.appConfig.cors.origin = ['xxx'];
        mockRequest = new MockRequest('/form', '', 'OPTIONS');
        const result = await keycloakAuthProvider.getUser(mockRequest, mockResponse, null);
        expect(result).to.be.null;
    });
    it('returns null if request path healthz', async () => {
        mockRequest = new MockRequest('/healthz', '', 'GET');
        const result = await keycloakAuthProvider.getUser(mockRequest, mockResponse, null);
        expect(result).to.be.null;
    });
    it('returns user if x-user-email in header', async () => {
        mockRequest = new MockRequest('/form', '', 'GET', {'x-user-email': 'email'});
        // @ts-ignore
        keycloakService.getUser('email').returns(Promise.resolve(new User('email', 'email', [])));

        const result = await keycloakAuthProvider.getUser(mockRequest, mockResponse, null);

        expect(result.details.email).to.be.eq('email');
    });
    it('returns user', async () => {
        mockRequest = new MockRequest('/form', '', 'GET');

        // @ts-ignore
        keycloakService.keycloakInstance().getGrant(mockRequest, mockResponse).returns(Promise.resolve({
            access_token: {
                content: {
                    email: 'email',
                    realm_access: {
                        roles: [],
                    },
                },
            },
        }));

        const result = await keycloakAuthProvider.getUser(mockRequest, mockResponse, null);
        expect(result.details.email).to.be.eq('email');

    });

    it('returns null if exception thrown', async () => {
        mockRequest = new MockRequest('/form', '', 'GET');

        // @ts-ignore
        keycloakService.keycloakInstance().getGrant(mockRequest, mockResponse).returns(Promise.reject(new Error('Failed')));

        const result = await keycloakAuthProvider.getUser(mockRequest, mockResponse, null);
        expect(result).to.be.null;

    });
});
