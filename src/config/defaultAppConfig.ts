import AppConfig from '../interfaces/AppConfig';
import { ApplicationConstants } from '../constant/ApplicationConstants';

export const FIFTY_EIGHT_SECONDS = '58000';
const MAX_ENTRIES = 100;
const DEFAULT_REDIS_PORT = 6379;

const {
  KEYCLOAK_PROTOCOL,
  KEYCLOAK_URL,
  API_FORM_KEYCLOAK_CLIENT_ID,
  API_FORM_KEYCLOAK_BEARER_ONLY,
  KEYCLOAK_REALM,
  KEYCLOAK_TOKEN_REFRESH_INTERVAL,
  API_FORM_KEYCLOAK_ADMIN_USERNAME,
  API_FORM_KEYCLOAK_ADMIN_PASSWORD,
  API_FORM_KEYCLOAK_ADMIN_CLIENT_ID,
  API_FORM_KEYCLOAK_ROLES,
  API_FORM_CORS_ORIGIN,
  API_FORM_LOG_ENABLE_CHANGE,
  API_FORM_LOG_CHANGE_TIMEOUT,
  API_FORM_CACHE_ROLE_MAX_AGE,
  API_FORM_CACHE_ROLE_MAX_ENTRIES,
  API_FORM_CACHE_USER_ROLE_ENTRIES,
  API_FORM_CACHE_FORM_MAX_AGE,
  API_FORM_CACHE_FORM_MAX_ENTRIES,
  API_FORM_CACHE_USER_FORM_ENTRIES,
  API_FORM_CACHE_USER_MAX_AGE,
  API_FORM_CACHE_USER_MAX_ENTRIES,
  API_FORM_LOG_ENABLE_QUERY,
  REDIS_PORT,
  REDIS_SSL,
  REDIS_URI,
  REDIS_TOKEN,
  API_FORM_CORRELATION_ID_REQUEST_HEADER,
  DATA_CONTEXT_PLUGIN_LOCATION,
  DATA_CONTEXT_PLUGIN_EXECUTION_TIMEOUT,
  API_FORM_BUSINESS_KEY_ENABLED,
  API_FORM_BUSINESS_KEY_PREFIX
} = process.env;

const defaultAppConfig: AppConfig = {
  dataContextPluginLocation: DATA_CONTEXT_PLUGIN_LOCATION,
  dataContextPluginExecutionTimeout: DATA_CONTEXT_PLUGIN_EXECUTION_TIMEOUT || '20000',
  businessKey: {
    enabled: API_FORM_BUSINESS_KEY_ENABLED ? (API_FORM_BUSINESS_KEY_ENABLED === 'true') : false,
    prefix: API_FORM_BUSINESS_KEY_PREFIX || 'DEV'
  },
  keycloak: {
    protocol: KEYCLOAK_PROTOCOL || 'http://',
    url: KEYCLOAK_URL || 'localhost',
    resource: API_FORM_KEYCLOAK_CLIENT_ID,
    bearerOnly: API_FORM_KEYCLOAK_BEARER_ONLY || 'true',
    realm: KEYCLOAK_REALM,
    confidentialPort: 0,
    sslRequired: 'external',
    tokenRefreshInterval: KEYCLOAK_TOKEN_REFRESH_INTERVAL || FIFTY_EIGHT_SECONDS,
    admin: {
      username: API_FORM_KEYCLOAK_ADMIN_USERNAME,
      password: API_FORM_KEYCLOAK_ADMIN_PASSWORD,
      clientId: API_FORM_KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli',
    },
  },
  admin: {
    roles: API_FORM_KEYCLOAK_ROLES ?
            API_FORM_KEYCLOAK_ROLES.split(',') : ['platform'  ],
  },
  cors: {
    origin: API_FORM_CORS_ORIGIN ? API_FORM_CORS_ORIGIN.split(',') : [],
  },
  log: {
    enabled: API_FORM_LOG_ENABLE_CHANGE ? API_FORM_LOG_ENABLE_CHANGE === 'true' : false,
    timeout: Number(API_FORM_LOG_CHANGE_TIMEOUT),
  },
  cache: {
    role: {
      maxAge: API_FORM_CACHE_ROLE_MAX_AGE ? +API_FORM_CACHE_ROLE_MAX_AGE : +FIFTY_EIGHT_SECONDS,
      maxEntries: API_FORM_CACHE_ROLE_MAX_ENTRIES ?
                +API_FORM_CACHE_USER_ROLE_ENTRIES : MAX_ENTRIES,
    },
    form: {
      maxAge: API_FORM_CACHE_FORM_MAX_AGE ? +API_FORM_CACHE_FORM_MAX_AGE : +FIFTY_EIGHT_SECONDS,
      maxEntries: API_FORM_CACHE_FORM_MAX_ENTRIES ?
                +API_FORM_CACHE_USER_FORM_ENTRIES : MAX_ENTRIES,
    },
    user: {
      maxAge: API_FORM_CACHE_USER_MAX_AGE ? +API_FORM_CACHE_USER_MAX_AGE : +FIFTY_EIGHT_SECONDS,
      maxEntries: API_FORM_CACHE_USER_MAX_ENTRIES ?
                +API_FORM_CACHE_USER_MAX_ENTRIES : MAX_ENTRIES,
    },
  },
  query: {
    log: {
      enabled: API_FORM_LOG_ENABLE_QUERY ? (API_FORM_LOG_ENABLE_QUERY === 'true') : false,
    },
  },
  redis: {
    ssl: REDIS_SSL ? REDIS_SSL === 'true' : false,
    port: REDIS_PORT ? +REDIS_PORT : DEFAULT_REDIS_PORT,
    host: REDIS_URI || '127.0.0.1',
    token: "mypass",
  },
  correlationIdRequestHeader: API_FORM_CORRELATION_ID_REQUEST_HEADER
        || ApplicationConstants.DEFAULT_CORRELATION_REQUEST_ID,

};

export default defaultAppConfig;
