'use strict';

const winston = require('winston');

const Config = require('./config');

class Logger {
    static outputFile() {
        return `${Config.LOGS_PATH}/output.log`;
    }

    constructor(opts) {
        const options = { outputs: [Logger.Console, Logger.File], ...opts };
        this._options = options;
        this._logger = new winston.Logger({
            transports: this._options.outputs,
        });

        if (process.env.NODE_ENV === 'test' && !this._options.overrideMock) {
            Logger.LOG_LEVELS.forEach((level) => {
                this._logger[level] = () => {};
            });
        }
    }

    on(event, cb) {
        this._logger.on(event, cb);
    }

    getOptions() {
        return this._options;
    }

    exception(location) {
        const self = this;
        return (e) => {
            const error = e || {};
            self.error(`Error Thrown @ ${location}: ${error.toString()}\n`, {
                error: error.stack,
            });
        };
    }

    query(options, cb) {
        this._logger.query(options, cb);
    }
}

Logger.LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
Logger.LOG_LEVELS.forEach((level) => {
    Logger.prototype[level] = function logFunction(...args) {
        this._logger[level].apply(this, args);
    };
});

Logger.Console = new winston.transports.Console({
    level: 'verbose',
    colorize: true,
});
Logger.File = new winston.transports.File({
    level: 'verbose',
    filename: Logger.outputFile(),
});

module.exports = Logger;
