'use strict';

const assert = require('chai').assert;

const Logger = require('../lib/logger');
let log;

describe('Logger', () => {
    describe('basic usage', () => {
        before(() => {
            log = new Logger();
        });

        it('defines all the basic log levels', () => {
            ['error', 'warn', 'info', 'verbose', 'debug', 'silly'].forEach((level) => {
                assert.isFunction(log[level]);
            });
        });

        it('has default option', () => {
            const defaultOptions = log.getOptions();
            assert.deepEqual(defaultOptions.outputs, [Logger.Console]);
        });
    });

    describe('with options', () => {
        it('can be passed other transports', () => {
            const outputs = [Logger.Console, Logger.File];
            log = new Logger({ outputs });

            assert.deepEqual(log.getOptions().outputs, outputs);
        });
    });
});
