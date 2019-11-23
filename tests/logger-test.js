const fs = require('fs');

const Logger = require('../lib/logger');

let log;

describe('Logger', () => {
    afterAll(() => {
        fs.unlinkSync(Logger.outputFile());
    });
    describe('basic usage', () => {
        beforeAll(() => {
            log = new Logger({ options: [Logger.Console], overrideMock: true });
        });

        it('defines all the basic log levels', () => {
            ['error', 'warn', 'info', 'verbose', 'debug', 'silly'].forEach((level) => {
                expect(typeof log[level]).toBe('function');
            });
        });

        it('has default option', () => {
            const defaultOptions = log.getOptions();
            expect(defaultOptions.outputs).toEqual([Logger.Console, Logger.File]);
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

                            expect(output).toContain('"meta":true');
                            expect(output).toContain(errorMsg);
                            expect(output).toContain(infoMsg);
                            done();
                        });
                    }
                }, 5);
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
                        expect(output).toContain(msg));
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
                        expect(results.file.length).toBe(10);
                        results.file.forEach(result => expect(result).toBeDefined());
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

            expect(log.getOptions().outputs).toEqual(outputs);
        });
    });
});
