'use strict';

const fs = require('fs');

const assert = require('chai').assert;

const Logger = require('../lib/logger');
let log;

describe('Logger', () => {
    describe('basic usage', () => {
        before(() => {
            log = new Logger({ options: [Logger.Console] });
        });

        after(() => {
            fs.unlinkSync(Logger.outputFile());
        });

        it('defines all the basic log levels', () => {
            ['error', 'warn', 'info', 'verbose', 'debug', 'silly'].forEach((level) => {
                assert.isFunction(log[level]);
            });
        });

        it('has default option', () => {
            const defaultOptions = log.getOptions();
            assert.deepEqual(defaultOptions.outputs, [Logger.Console, Logger.File]);
        });

        it('logs to a file', (done) => {
            let calls = 0;
            const errorMsg = 'This is an error message';
            const infoMsg = 'This is an info message';
            const metadata = { meta: true };

            const msgLogged = () => {
                setTimeout(() => {
                    calls++;
                    if (calls === 2) {
                        fs.readFile(Logger.outputFile(), (err, data) => {
                            const output = data.toString();

                            assert.include(output, '"meta":true');
                            assert.include(output, errorMsg);
                            assert.include(output, infoMsg);
                            done();
                        });
                    }
                }, 1);
            };

            const fileLogger = new Logger({ outputs: [Logger.File] });

            fileLogger.error(errorMsg, metadata, msgLogged);
            fileLogger.info(infoMsg, metadata, msgLogged);
        });

        it('creates exception loggers', (done) => {
            const fileLogger = new Logger({ outputs: [Logger.File] });

            fileLogger.on('logging', () => {
                fs.readFile(Logger.outputFile(), (err, data) => {
                    const output = data.toString();

                    ['a promise', 'some horrible error', 'logger-test'].forEach(
                        (msg) => assert.include(output, msg)
                    );
                    done();
                });
            });

            new Promise((resolve, reject) => {
                reject(new Error('some horrible error!'));
            }).then(() => {}).catch(fileLogger.exception('a promise'));


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
