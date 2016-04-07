'use strict';

const assert = require('chai').assert;
const fs = require('fs-extra');
const nock = require('nock');

const Config = require('../lib/config');

const HtmlProcessor = require('../lib/html-processor.js');
const fixturesPath = './tests/fixtures';
const outputFolder = Config.IMAGES_TMP;

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
                '/image?size=30', '/picture.png', '/article/image.png', '/image.png',
            ].forEach((path) => {
                scope.get(path).replyWithFile(
                    200,
                    `${fixturesPath}/placeholder.png`,
                    { 'Content-type': 'image/png' }
                );
            });
            fs.emptyDir(outputFolder, () => {});
        });

        afterEach(() => {
            fs.emptyDir(outputFolder, () => {});
        });

        it('downloads images', (done) => {
            HtmlProcessor.extractImages(mockSection.url, mockSection.html).then((output) => {
                assert.lengthOf(output.html.match(/\.\.\/images\/.*\.png/g), 4);
                scope.isDone();
                done();
            }).catch(done);
        });

        it('saves images in the specified folder', (done) => {
            HtmlProcessor.extractImages(mockSection.url, mockSection.html).then(() => {
                fs.readdir(outputFolder, (err, files) => {
                    assert.lengthOf((files || []), 3);
                    done();
                });
            }).catch(done);
        });

        describe('helpers', () => {
            it('can convert urls', () => {
                const root = 'http://test.fake/hello/stuff.html';
                const tests = ['http://a.c/b.jpg', '../img.png', './img.jpg', 'assets/img.jpg', '//cdn.com/path/image.png', 'image.png'];
                const expected = [
                    'http://a.c/b.jpg',
                    'http://test.fake/img.png',
                    'http://test.fake/hello/img.jpg',
                    'http://test.fake/hello/assets/img.jpg',
                    'http://cdn.com/path/image.png',
                    'http://test.fake/hello/image.png',
                ];

                tests.forEach((test, idx) => {
                    assert.equal(HtmlProcessor.absolutifyUrl(root, test), expected[idx]);
                });
            });

            it('can resolve urls with a path', () => {
                const root = 'http://test.fake/hello/';
                const tests = ['image.png'];
                const expected = [
                    'http://test.fake/hello/image.png',
                ];

                tests.forEach((test, idx) => {
                    assert.equal(HtmlProcessor.absolutifyUrl(root, test), expected[idx]);
                });
            });
        });
    });
});
