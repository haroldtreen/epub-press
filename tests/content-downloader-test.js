const nock = require('nock');
const sinon = require('sinon');
const fs = require('fs-extra');

const Config = require('../lib/config');
const MockContentDownloader = require('./mocks/content-downloader');
const ContentDownloader = require('../lib/content-downloader');

const URL = 'http://google.com';
const HTML = '<html><body><h1>Hello World</h1></body></html>';
const FIXTURES_PATH = './tests/fixtures';

const fsStub = sinon.stub().callsArg(3);

describe('Content Downloader', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    describe('.all', () => {
        it('downloads multiple downloaders', () => {
            const scope = nock(URL)
                .get('/')
                .times(2)
                .reply(200, 'Hello');
            const c1 = new ContentDownloader(URL);
            const c2 = new ContentDownloader(URL);

            return ContentDownloader.all([c1, c2]).then((results) => {
                results.forEach((result) => {
                    expect(result.error).not.toBeDefined();
                });
                scope.done();
            });
        });

        it('can limit download size for all passed downloaders', () => {
            const scope = nock(URL)
                .get('/')
                .times(3)
                .replyWithFile(
                    200,
                    `${FIXTURES_PATH}/placeholder.png` // 4.3 kB image
                );
            const maxSize = 5300;
            const c1 = new ContentDownloader(URL);
            const c2 = new ContentDownloader(URL);
            const c3 = new ContentDownloader(URL);

            return ContentDownloader.all([c1, c2, c3], { maxSize }).then((results) => {
                const totalContent = results.reduce((t, res) => t + (res.contentLength || 0), 0);
                const numSuccess = results.reduce((num, r) => {
                    const value = r.error ? 0 : 1;
                    return num + value;
                }, 0);
                expect(totalContent).toBeLessThan(maxSize);
                expect(numSuccess).toEqual(1);
                scope.done();
            });
        });

        it('handles failed downloaders', () => {
            const scope = nock(URL)
                .get('/')
                .reply(200, 'Hello');
            const content1 = new ContentDownloader(URL);
            const content2 = new ContentDownloader();

            return ContentDownloader.all([content1, content2]).then(([r1, r2]) => {
                expect(r1.error).not.toBeDefined();
                expect(r2.error).toBeDefined();
                scope.done();
            });
        });

        it('throttles the downloads happening concurrently', () => {
            let runningDownloaders = 0;
            const mockContentDownloader = MockContentDownloader({
                download: () =>
                    new Promise((resolve, reject) => {
                        runningDownloaders += 1;
                        const currentRunningDownloadersCount = runningDownloaders;
                        setTimeout(() => {
                            if (currentRunningDownloadersCount === runningDownloaders) {
                                resolve({ contentlength: 10 });
                            } else {
                                reject(new Error('Multiple downloaders running.'));
                            }
                        }, 50);
                    }),
            });

            return ContentDownloader.all([mockContentDownloader, mockContentDownloader]).then(
                (results) => {
                    results.forEach((result) => {
                        expect(result.error).not.toBeDefined();
                    });
                }
            );
        });
    });

    describe('constructor', () => {
        it('wraps a url', () => {
            const content = new ContentDownloader(URL);
            expect(content.getUrl()).toEqual(URL);
        });

        it('accepts a path option', () => {
            const content = new ContentDownloader(URL, { path: __dirname });

            expect(content.getPath()).toEqual(__dirname);
        });
    });

    describe('#getUrl', () => {
        it('returns the url', () => {
            const content = new ContentDownloader(URL);
            expect(content.getUrl()).toEqual(URL);
        });
    });

    describe('#getFiletype', () => {
        it('can figure out a filetype', () => {
            const types = {
                '.png': ['http://g.co/image.png', ''],
                '.jpg': ['', 'image/jpg'],
                '.JPEG': ['/image.JPEG', ''],
                '.gif': ['', 'image/gif'],
                '': ['', ''], // error case
            };

            Object.keys(types).forEach((output) => {
                const input = types[output];
                const content = new ContentDownloader(input[0]);
                expect(content.getFiletype(input[1])).toEqual(output);
            });
        });
    });

    describe('#getFilename', () => {
        it('recognizes all the filetypes', () => {
            const content = new ContentDownloader(URL);
            const typesMap = ContentDownloader.FILE_TYPES;
            Object.keys(typesMap).forEach((contentType) => {
                const filename = content.getFilename(contentType);
                expect(filename).toContain(typesMap[contentType]);
            });
        });

        it('pulls filetypes from the url', () => {
            const content = new ContentDownloader('http://g.co/img.png');

            expect(content.getFilename('image/fake')).toContain('.png');
        });
    });

    describe('#saveResult', () => {
        it('resolves to the regular result when no path provided', () => {
            const content = new ContentDownloader(URL);
            const mockResult = {
                statusCode: 200,
                contentType: 'image/jpg',
                contentLength: 2000,
                content: 'Hello',
            };
            return content.saveResult(mockResult).then((savedResult) => {
                expect(savedResult).toEqual(mockResult);
            });
        });

        it('resolves with a filepath when a path is provided', () => {
            const options = { path: Config.IMAGES_TMP };
            const content = new ContentDownloader(URL, options);

            const mockResult = { content: 'hello', contentType: 'image/jpg' };
            const stub = sinon.stub(fs, 'outputFile').callsFake(fsStub);

            return content.saveResult(mockResult).then((savedResult) => {
                expect(savedResult.path).toContain(options.path);
                expect(savedResult.content).not.toBeDefined();
                expect(stub.called).toBe(true);
                stub.restore();
            });
        });
    });

    describe('#onRequestComplete', () => {
        it('creates a function that rejects if called with an error', (done) => {
            const content = new ContentDownloader(URL);

            const reject = () => {
                done();
            };
            const resolve = () => {
                done(new Error('On request resolved.'));
            };

            const callback = content.onRequestComplete(resolve, reject);

            callback(new Error('Boom!'));
        });
    });

    describe('#download', () => {
        it('resolves with the content in the result', () => {
            const content = new ContentDownloader(URL);

            const scope = nock(URL)
                .get('/')
                .reply(200, HTML);

            return content.download().then((result) => {
                expect(result.content.toString()).toEqual(HTML);
                scope.done();
            });
        });

        it('resolves with metadata in the result', () => {
            const options = { metadata: { src: '/file.jpg' } };
            const content = new ContentDownloader(URL, options);

            const scope = nock(URL)
                .get('/')
                .reply(200);

            return content.download().then((result) => {
                expect(result.src).toEqual(options.metadata.src);
                scope.done();
            });
        });

        it('resolves with a path to the file in the results', () => {
            const options = { path: Config.IMAGES_TMP };
            const content = new ContentDownloader(URL, options);

            const scope = nock(URL)
                .get('/')
                .replyWithFile(200, `${FIXTURES_PATH}/placeholder.png`, {
                    'Content-type': 'image/png',
                });
            const stub = sinon.stub(fs, 'outputFile').callsFake(fsStub);

            return content.download().then((result) => {
                expect(result.path).toContain(options.path);
                expect(result.path).toContain('.png');
                expect(stub.called).toBe(true);
                stub.restore();
                scope.done();
            });
        });

        it('rejects if no url has been provided', () => {
            const content = new ContentDownloader();

            return content.download().catch((err) => {
                expect(err.toString()).toMatch(/url/i);
            });
        });

        it('rejects when url returns bad status codes', () => {
            const content = new ContentDownloader(URL);

            const scope = nock(URL)
                .get('/')
                .reply(404);

            return content.download().catch((err) => {
                expect(err.toString()).toMatch(/status/i);
                scope.done();
            });
        });

        it('rejects when the download is too large', () => {
            const content = new ContentDownloader(URL, { maxSize: 1 });

            const scope = nock(URL)
                .get('/')
                .reply(200, HTML);

            return content.download().catch((error) => {
                expect(error.toString()).toMatch(/abort/i);
                scope.done();
            });
        });
    });
});
