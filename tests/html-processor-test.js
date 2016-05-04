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
        it('can remove elements from an HTML string', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/scripts.html`).toString();

            ['script', 'p', 'div'].forEach((tag) => {
                assert.match(html, new RegExp(`<${tag}>`));
                html = HtmlProcessor.removeElement(tag, html);
                assert.notMatch(html, new RegExp(`<${tag}>`));
            });
        });

        it('can bubble up tag content', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/article.html`).toString();

            assert.match(html, /article/);
            const articleContents = html.match(/<article>((.|\s)*)<\/article>/m)[1];
            html = HtmlProcessor.replaceWithChildren('article', html);
            assert.include(html, articleContents);
            assert.notMatch(html, /<article>/);
        });

        it('can maximize element size', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/images.html`).toString();

            assert.notMatch(html, /100%/);
            html = HtmlProcessor.maximizeSize('img', html);
            assert.match(html, /80px/);
            assert.notMatch(html, /30%/);
            assert.match(html, /100%/);
        });

        it('can remmove non ebook friendly attributes', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/invalid-attributes.html`).toString();

            ['srcset', 'property', 'style', 'itemprop'].forEach((attr) =>
                assert.match(html, new RegExp(attr))
            );

            html = HtmlProcessor.removeInvalidAttributes('div', html);

            ['srcset', 'property', 'style', 'itemprop'].forEach((attr) =>
                assert.notMatch(html, new RegExp(attr))
            );
        });

        it('can remove divs with certain classes and ids', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/popups.html`).toString();

            html = HtmlProcessor.filterDivs('popup', html);
            assert.notMatch(html, /popup/);
            assert.match(html, /banner/);
            assert.match(html, /advertisement/);

            html = HtmlProcessor.filterDivs(['banner', 'advertisement'], html);
            assert.notMatch(html, /banner/);
            assert.notMatch(html, /advertisement/);
        });

        it('can replace divs with children', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/wrappers.html`).toString();

            html = HtmlProcessor.replaceDivsWithChildren(['wrapper'], html);
            assert.notMatch(html, /wrapper/);
            assert.match(html, /content/);
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
            scope.get('/bad-source').reply('404', 'Not Found');
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
