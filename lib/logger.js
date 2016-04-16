'use strict';

const winston = require('winston');

const Config = require('./config');

class Logger {
    constructor(opts) {
        const options = Object.assign({ outputs: [Logger.Console] }, opts);
        this._options = options;
    }

    getOptions() {
        return this._options;
    }
}

Logger.LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
Logger.LOG_LEVELS.forEach((level) => {
    Logger.prototype[level] = () => {

    };
});

Logger.Console = winston.transports.Console;
Logger.File = winston.transports.File;

module.exports = Logger;
