import {createLogger, format, transports} from "winston";
const {combine, json, splat} = format;

const logger = createLogger({
    format: combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        splat(),
        json()
    ),
    defaultMeta: { service: 'form-api-service' },
    transports: [
        new transports.Console()
    ],
    exitOnError: false,
});

export default logger;
