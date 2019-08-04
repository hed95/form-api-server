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

To run all the tests run the following:
```bash
npm run test
```

NPM tests are broken down into unit and integration.

```bash
npm run test:unit
```
or
```bash
npm run test:int
```

To run tests full all coverage data, run the following

```bash
npm run cover
```


### API Reference 
http://localhost:3000/api-docs/swagger/#/

##### Environment variable

| Environment variable 	        | Type 	        | Default Value 	|
|-------------------------------|---------------|-------------------|
| NODE_ENV                      | string    	| *OPTIONAL*        |   
| DB_USERNAME                   | string    	| *REQUIRED*        |                       
| DB_PASSWORD                   | string    	| *REQUIRED*        |                       
| DB_NAME                       | string    	| *REQUIRED*        |                       
| DB_HOSTNAME                   | string    	| *REQUIRED*        |                       
| DB_PORT                       | string    	| false             |                       
| DB_SSL                        | string    	| *REQUIRED*        |                       
| AUTH_URL                      | string    	| *REQUIRED*        |   
| AUTH_CLIENT_ID                | string    	| *REQUIRED*        |                       
| AUTH_BEARER_ONLY              | boolean    	| true           	|                       
| AUTH_REALM                    | string    	| *REQUIRED*        |                       
| AUTH_ADMIN_USERNAME           | string    	| *REQUIRED*        |                       
| AUTH_ADMIN_USERNAME           | string    	| *REQUIRED*        |                       
| AUTH_ADMIN_CLIENT_ID          | string    	| admin-cli         |                       
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
| PORT                          | number        | 3000              |


                                     
## Form Operations

If no role is used when creating a form then by default the service will apply a 'anonymous' role. This
means that anyone can make a request to get that form. If you wish to restrict access then you can define custom roles with the form.


##### Count only 

If you wish only to return the count of all the forms in the platform then execute the following:

```js
/form?countOnly=true
```

This will output the following result:

```json
{
    "total": 2,
    "forms": []
}
```

##### Select attributes

You can specify certain fields of a form when making a call to GET /forms. For example if you are only interested in returning the name you can execute the following:

```js
/forms?select=name
```

This will output the following result:

```json
{
    "total": 1,
    "forms": [
        {
        "name": "testForm",
        "createdBy": "username@domain.com",
        "createdOn": "2019-07-25T09:57:39.644Z",
        "updatedBy": "username@domain.comm",
        "updatedOn": "2019-07-30T08:04:27.936Z"
      }
    ]
}
```

##### Filter Operators

You can filter forms using the filter query parameter. For example:

```js
/form?filter=name__eq__myForm
``` 

The following operators are available (with examples:
```markdown
eq - name__eq__myForm
ne - name__ne__myForm
in - name__in__myForm|myForm2|myForm3
like - name__like__a
regexp - name__regexp__myForm
notRegexp - name__notRegexp__myForm
endsWith - name__endsWith__myForm
contains - name__contains__myForm
startsWith - name__startsWith__myForm
```

## Admin Operations */admin*

This service has a few admin operations. The admin operations are only available if the user has roles as specified in the environment config ADMIN_ROLES. The roles for the user
are extracted from the bearer token passed into the API.

### GET /forms 
This endpoint returns all DB Form versions currently held in the DB. You will need to paginate in order to collect all versions

### DELETE /forms/{:id}

This endpoint allows the physical deletion of a form from the DB. 

**This a cascading operation so all versions and comments of the form will be deleted. Once this has been done it cannot be undone.**

### POST /log

By the default the log level is set at DEBUG. You change the log level using this endpoint. For example:
```json
{
 "loglevel": "info"
}
```
If you do not want this feature enabled then set this environment variable to false ENABLE_LOG_CHANGE
If you have configured LOG_CHANGE_TIMEOUT with a non -1 number then after the specified timeout the log level will revert back to DEBUG. This is to ensure you don't leave the logging at INFO level indefinitely causing you log files to fill up.

### POST /query-log
This endpoint enables SQL query logging at INFO level. Body not required

### DELETE /query-log
This endpoint disables SQL query logging at INFO level.

### DELETE /cache/user
Clears internal in memory user cache

### DELETE /cache/form
Clears internal in memory form cache
