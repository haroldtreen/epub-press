const nock = require('nock');
const assert = require('chai').assert;
const sinon = require('sinon');
const fs = require('fs-extra');

const Config = require('../lib/config');
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
            const scope = nock(URL).get('/').times(2).reply(200, 'Hello');
            const c1 = new ContentDownloader(URL);
            const c2 = new ContentDownloader(URL);

            return ContentDownloader.all([c1, c2]).then((results) => {
                results.forEach((result) => {
                    assert.isUndefined(result.error);
                });
                scope.done();
            });
        });

        it('can limit download size for all passed downloaders', () => {
            const scope = nock(URL).get('/').times(3).replyWithFile(
        200,
        `${FIXTURES_PATH}/placeholder.png` // 4.3 kB image
      );
            const maxSize = 5300;
            const c1 = new ContentDownloader(URL);
            const c2 = new ContentDownloader(URL);
            const c3 = new ContentDownloader(URL);

            return ContentDownloader.all([c1, c2, c3], { maxSize }).then((results) => {
                const totalContent = results.reduce(
          (t, res) => t + (res.contentLength || 0),
          0
        );
                const numSuccess = results.reduce((num, r) => {
                    const value = r.error ? 0 : 1;
                    return num + value;
                }, 0);
                assert.isBelow(totalContent, maxSize);
                assert.equal(numSuccess, 1);
                scope.done();
            });
        });

        it('handles failed downloaders', () => {
            const scope = nock(URL).get('/').reply(200, 'Hello');
            const content1 = new ContentDownloader(URL);
            const content2 = new ContentDownloader();

            return ContentDownloader.all([content1, content2]).then(([r1, r2]) => {
                assert.isUndefined(r1.error);
                assert.isDefined(r2.error);
                scope.done();
            });
        });
    });

    describe('constructor', () => {
        it('wraps a url', () => {
            const content = new ContentDownloader(URL);
            assert.equal(content.getUrl(), URL);
        });

        it('accepts a path option', () => {
            const content = new ContentDownloader(URL, { path: __dirname });

            assert.equal(content.getPath(), __dirname);
        });
    });

    describe('#getUrl', () => {
        it('returns the url', () => {
            const content = new ContentDownloader(URL);
            assert.equal(content.getUrl(), URL);
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
                assert.equal(content.getFiletype(input[1]), output);
            });
        });
    });

    describe('#getFilename', () => {
        it('recognizes all the filetypes', () => {
            const content = new ContentDownloader(URL);
            const typesMap = ContentDownloader.FILE_TYPES;
            Object.keys(typesMap).forEach((contentType) => {
                const filename = content.getFilename(contentType);
                assert.include(filename, typesMap[contentType]);
            });
        });

        it('pulls filetypes from the url', () => {
            const content = new ContentDownloader('http://g.co/img.png');

            assert.include(content.getFilename('image/fake'), '.png');
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
                assert.deepEqual(savedResult, mockResult);
            });
        });

        it('resolves with a filepath when a path is provided', () => {
            const options = { path: Config.IMAGES_TMP };
            const content = new ContentDownloader(URL, options);

            const mockResult = { content: 'hello', contentType: 'image/jpg' };
            const stub = sinon.stub(fs, 'outputFile', fsStub);

            return content.saveResult(mockResult).then((savedResult) => {
                assert.include(savedResult.path, options.path);
                assert.isUndefined(savedResult.content);
                assert.isTrue(stub.called);
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

            const scope = nock(URL).get('/').reply(200, HTML);

            return content.download().then((result) => {
                assert.equal(result.content, HTML);
                scope.done();
            });
        });

        it('resolves with metadata in the result', () => {
            const options = { metadata: { src: '/file.jpg' } };
            const content = new ContentDownloader(URL, options);

            const scope = nock(URL).get('/').reply(200);

            return content.download().then((result) => {
                assert.equal(result.src, options.metadata.src);
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
            const stub = sinon.stub(fs, 'outputFile', fsStub);

            return content.download().then((result) => {
                assert.include(result.path, options.path);
                assert.include(result.path, '.png');
                assert.isTrue(stub.called);
                stub.restore();
                scope.done();
            });
        });

        it('rejects if no url has been provided', () => {
            const content = new ContentDownloader();

            return content.download().catch((err) => {
                assert.match(err.toString(), /url/i);
            });
        });

        it('rejects when url returns bad status codes', () => {
            const content = new ContentDownloader(URL);

            const scope = nock(URL).get('/').reply(404);

            return content.download().catch((err) => {
                assert.match(err.toString(), /status/i);
                scope.done();
            });
        });

        it('rejects when the download is too large', () => {
            const content = new ContentDownloader(URL, { maxSize: 1 });

            const scope = nock(URL).get('/').reply(200, HTML);

            return content.download().catch((error) => {
                assert.match(error.toString(), /abort/i);
                scope.done();
            });
        });
    });
});
