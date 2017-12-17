const fs = require('fs');
const { assert } = require('chai');

const Logger = require('../lib/logger');

let log;

describe('Logger', () => {
    after(() => {
        fs.unlinkSync(Logger.outputFile());
    });
    describe('basic usage', () => {
        before(() => {
            log = new Logger({ options: [Logger.Console], overrideMock: true });
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
                            if (err) {
                                done(err);
                            }
                            const output = data.toString();

                            assert.include(output, '"meta":true');
                            assert.include(output, errorMsg);
                            assert.include(output, infoMsg);
                            done();
                        });
                    }
                }, 1);
            };

            const fileLogger = new Logger({
                outputs: [Logger.File],
                overrideMock: true,
            });

            fileLogger.error(errorMsg, metadata, msgLogged);
            fileLogger.info(infoMsg, metadata, msgLogged);
        });

        it('creates exception loggers', (done) => {
            const fileLogger = new Logger({
                outputs: [Logger.File],
                overrideMock: true,
            });

            fileLogger.on('logging', () => {
                fs.readFile(Logger.outputFile(), (err, data) => {
                    const output = data.toString();

                    ['a promise', 'some horrible error', 'logger-test'].forEach(msg =>
                        assert.include(output, msg));
                    done();
                });
            });

            new Promise((resolve, reject) => {
                reject(new Error('some horrible error!'));
            }).catch(fileLogger.exception('a promise'));
        });
    });

    describe('querying', () => {
        it('can query the log file', (done) => {
            const fileLogger = new Logger({
                outputs: [Logger.File],
                overrideMock: true,
            });
            const numLogs = 40;
            let calls = 0;

            const msgLogged = () => {
                calls++;
                if (calls === numLogs) {
                    fileLogger.query({ limit: 10 }, (err, results) => {
                        assert.lengthOf(results.file, 10);
                        results.file.forEach(result => assert.isDefined(result, 'field'));
                        done();
                    });
                }
            };

            for (let i = 0; i < numLogs; i++) {
                fileLogger.info(`Query result ${i}`, { field: true }, msgLogged);
            }
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
