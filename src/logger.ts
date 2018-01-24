import * as Winston from 'winston';

const level = process.env.LOG_LEVEL || 'debug'; //TODO: Change to debug for production server.

export const logger = new Winston.Logger({
    transports: [
        new Winston.transports.Console({
            level: level,
            timestamp: function () {
                return (new Date()).toISOString();
            }
        })
    ]
});