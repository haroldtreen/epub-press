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

    describe('#getFilename', () => {
        it('recognizes all the filetypes', () => {
            const content = new ContentDownloader(URL);
            const typesMap = ContentDownloader.FILE_TYPES;
            Object.keys(typesMap).forEach((contentType) => {
                const filename = content.getFilename(contentType);
                assert.include(filename, typesMap[contentType]);
            });
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

    describe('#download', () => {
        it('resolves with the content in the result', () => {
            const content = new ContentDownloader(URL);

            const scope = nock(URL).get('/').reply(200, HTML);

            return content.download().then((result) => {
                assert.isTrue(result.success);
                assert.equal(result.content, HTML);
                scope.done();
            });
        });

        it('resolves with a path to the file in the results', () => {
            const options = { path: Config.IMAGES_TMP };
            const content = new ContentDownloader(URL, options);

            const scope = nock(URL).get('/').replyWithFile(
                200,
                `${FIXTURES_PATH}/placeholder.png`,
                { 'Content-type': 'image/png' }
            );
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
