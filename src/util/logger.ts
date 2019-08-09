import * as winston from 'winston';
import {createLogger, format, transports} from 'winston';
import httpContext from 'express-http-context';
import defaultAppConfig from '../config/defaultAppConfig';
import {ApplicationConstants} from '../constant/ApplicationConstants';

const {combine, json, splat} = format;

const addXRequestId = winston.format((info) => {
    info[defaultAppConfig.correlationIdRequestHeader] = httpContext.get(defaultAppConfig.correlationIdRequestHeader);
    return info;
});

const addUserId = winston.format((info) => {
    info.user = httpContext.get(ApplicationConstants.USER_ID);
    return info;
});

const logger = createLogger({
    format: combine(
        addXRequestId(),
        addUserId(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({stack: true}),
        splat(),
        json(),
    ),
    defaultMeta: {service: ApplicationConstants.SERVICE_NAME},
    transports: [
        new transports.Console({
            level: 'info',
        }),
    ],
    exitOnError: false,
});

export default logger;
