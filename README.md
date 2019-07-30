# Form API Service

##### Starting the service locally:

This API service can be started with an in-memory DB. Ensure NODE_ENV is not set to production and then run the following command:

```bash
npm run ts-build
npm run serve
```

If you wish to run the server but want to make changes and perform dynamic compilation, then use the following:
```bash
npm run watch-ts
npm run watch-node
``` 

### API Reference 
http://localhost:3000/api-docs/swagger/#/

##### Environment variable

| Environment variable 	        | Type 	        | Default Value 	|
|-------------------------------|:-------------:|-------------------|
| NODE_ENV                      | string    	| *REQUIRED*        |   
| DB_USERNAME                   | string    	| *REQUIRED*        |                       
| DB_PASSWORD                   | string    	| *REQUIRED*        |                       
| DB_NAME                       | string    	| *REQUIRED*        |                       
| DB_HOSTNAME                   | string    	| *REQUIRED*        |                       
| AUTH_URL                      | string    	| *REQUIRED*        |   
| AUTH_CLIENT_ID                | string    	| *REQUIRED*        |                       
| AUTH_BEARER_ONLY              | boolean    	| true           	|                       
| AUTH_REALM                    | string    	| *REQUIRED*        |                       
| AUTH_ADMIN_USERNAME           | string    	| *REQUIRED*        |                       
| AUTH_ADMIN_PASSWORD           | string    	| *REQUIRED*        |                       
| ADMIN_ROLES                   | array         | *OPTIONAL*        |
| ENABLE_LOG_CHANGE             | boolean    	| false             |  
| LOG_CHANGE_TIMEOUT            | number    	| false             |
| CORS_ORIGIN                   | array         | *OPTIONAL*        |
| CORRELATION_ID_REQUEST_HEADER | string        | *OPTIONAL*        |
| CACHE_ROLE_MAX_AGE            | number        | 2 mins (ms)       |
| CACHE_ROLE_MAX_ENTRIES        | number        | 100               |
| CACHE_FORM_MAX_AGE            | number        | 2 mins (ms)       |
| CACHE_FORM_MAX_ENTRIES        | number        | 100               |
| CACHE_USER_MAX_AGE            | number        | 2 mins (ms)       |
| CACHE_USER_MAX_ENTRIES        | number        | 100               |
| ENABLE_LOG_QUERY              | boolean       | false             |

                                     
##### Form 

If no role is used when creating a form then by default the service will apply a 'anonymous' role. This
means that anyone can make a request to get that form. If you wish to restrict access then you can define custom roles with the form.


