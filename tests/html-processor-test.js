'use strict';

const assert = require('chai').assert;
const fs = require('fs-extra');
const nock = require('nock');

const Config = require('../lib/config');

const HtmlProcessor = require('../lib/html-processor.js');
const fixturesPath = './tests/fixtures';
const outputFolder = `${Config.ROOT}/tmp/test-book/images/section-0`;

describe('HTML Processor', () => {
    let mockSection;
    beforeEach(() => {
        mockSection = {
            html: fs.readFileSync(`${fixturesPath}/images.html`).toString(),
            url: 'http://test.fake/article',
            imagesPath: outputFolder,
        };
    });

    describe('Filter methods', () => {
        it('can filter script tags', () => {
            const content = fs.readFileSync(`${fixturesPath}/scripts.html`).toString();
            const filteredContent = HtmlProcessor.cleanTags(content);
            assert.notMatch(filteredContent, /<script>/);
            assert.notMatch(filteredContent, /<\/script>/);
        });

        it('can bubble up article contents', () => {
            const content = fs.readFileSync(`${fixturesPath}/article.html`).toString();
            const filteredContent = HtmlProcessor.cleanTags(content);
            assert.notMatch(filteredContent, /<article>/);
            assert.notMatch(filteredContent, /<\/article>/);
            assert.match(filteredContent, /<div>/);
            assert.match(filteredContent, /<p>/);
            assert.match(filteredContent, /First/);
        });
    });

    describe('Image Extraction', () => {
        let scope;
        beforeEach(() => {
            scope = nock('http://test.fake');

            [
                '/image?size=30', '/picture.png', '/article/image.png',
            ].forEach((path) => {
                scope.get(path).replyWithFile(
                    200,
                    `${fixturesPath}/placeholder.png`,
                    { 'Content-type': 'image/png' }
                );
            });
        });

        afterEach(() => {
            fs.emptyDir(outputFolder, () => {});
        });

        it('downloads images', (done) => {
            const expectedOutput = fs.readFileSync(`${fixturesPath}/images-output.html`).toString();
            HtmlProcessor.extractImages(mockSection).then((output) => {
                assert.deepEqual(
                    output.replace(/\s{2,}|\n/g, ''),
                    expectedOutput.replace(/\s{2,}|\n/g, '')
                );
                scope.isDone();
                done();
            }).catch(done);
        });

        it('saves images in the specified folder', (done) => {
            HtmlProcessor.extractImages(mockSection).then(() => {
                fs.readdir(outputFolder, (err, files) => {
                    assert.lengthOf((files || []), 3);
                    done();
                });
            }).catch(done);
        });
    });

    describe('helpers', () => {
        it('can convert urls', () => {
            const root = 'http://test.fake/hello';
            const tests = ['http://a.c/b.jpg', '../img.png', './img.jpg'];
            const expected = [
                'http://a.c/b.jpg',
                'http://test.fake/img.png',
                'http://test.fake/hello/img.jpg',
            ];

            tests.forEach((test, idx) => {
                assert.equal(HtmlProcessor.absolutifyUrl(root, test), expected[idx]);
            });
        });

        it('can map remote files to local files', () => {
            const tests = ['http://a.b/c.png', 'http://a.b/c2.png', 'http://a.b/d/e/c3.png'];
            const expected = [
                `${outputFolder}/c.png`,
                `${outputFolder}/c2.png`,
                `${outputFolder}/d/e/c3.png`,
            ];

            tests.forEach((remote, index) => {
                const local = HtmlProcessor.localForRemote(mockSection, remote);
                assert.equal(local, expected[index]);
            });
        });
    });
});
