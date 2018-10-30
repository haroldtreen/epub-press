'use strict';

const { assert } = require('chai');
const glob = require('glob');
const fs = require('fs-extra');
const nock = require('nock');

const Config = require('../lib/config');
const Utilities = require('../lib/utilities');

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
            assert.include(html, articleContents.trim().substring(0, 20));
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

            ['srcset', 'property', 'itemprop'].forEach(attr =>
                assert.match(html, new RegExp(attr)));

            html = HtmlProcessor.removeInvalidAttributes('div', html);

            ['srcset', 'property', 'itemprop'].forEach(attr =>
                assert.notMatch(html, new RegExp(attr)));
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

        it('can convert elements into div', () => {
            const html = HtmlProcessor.convertToDiv('section', '<section>Hello World</section>');
            assert.equal(html, '<div>Hello World</div>');
        });

        it('can remove hidden elements', () => {
            [
                {
                    selector: 'span',
                    html: '<span style="display:none;"></span>',
                    remove: true,
                },
                {
                    selector: 'div',
                    html: '<div style="display:block;"></div>',
                    remove: false,
                },
                {
                    selector: 'div',
                    html: '<div style="display: none;"></div>',
                    remove: true,
                },
                {
                    selector: 'div',
                    html: '<div style="visibility: hidden;"></div>',
                    remove: true,
                },
            ].forEach((test) => {
                const method = test.remove ? 'notInclude' : 'include';
                assert[method](HtmlProcessor.removeHidden(test.selector, test.html), test.selector);
            });
        });

        it('can set elements to their innerText', () => {
            let html = '<code><span>var</span> hello;</code>';
            html = HtmlProcessor.replaceWithInnerText('code', html);

            assert.notInclude(html, '<span>');
            assert.include(html, 'var hello');
        });

        it('can remove indents', () => {
            const html = ['<code>', '   if (true) {', '      hello();', '   }', '</code>'].join('\n');
            const expectedHtml = ['<code>', 'if (true) {', '   hello();', '}', '</code>'].join('\n');

            assert.equal(HtmlProcessor.removeIndent('code', html), expectedHtml);
        });

        it('can set a root', () => {
            const nestyHtml = [
                '<html><body>',
                '<div><span>',
                '<div class="root"><p>Hello World</p></div>',
                '</span></div>',
                '</body></html>',
            ].join('\n');
            const expectedHtml = ['<html><body>', '<p>Hello World</p>', '</body></html>'].join('');
            const fixedHtml = HtmlProcessor.setRootNode('.root', nestyHtml);

            assert.equal(fixedHtml, expectedHtml);
        });

        it('defaults to nothing if no root found', () => {
            const nestyHtml = [
                '<html><body>',
                '<div><span>',
                '</span></div>',
                '</body></html>',
            ].join('\n');
            const fixedHtml = HtmlProcessor.setRootNode('.root', nestyHtml);

            assert.equal(fixedHtml, nestyHtml);
        });

        it('can remove elements with too few paragraphs', () => {
            const paragraphlessHtml = ['<article>', '<p>Hello</p>', '</article>'].join('\n');
            const fixedHtml = HtmlProcessor.filterParagraphless('article', paragraphlessHtml);
            assert.equal(fixedHtml, '');
        });

        it('can ignore elements with enough paragraphs', () => {
            const paragraphHtml = [
                '<article>',
                '<p>Hello</p>',
                '<p>Hello</p>',
                '<p>Hello</p>',
                '</article>',
            ].join('\n');
            const fixedHtml = HtmlProcessor.filterParagraphless('article', paragraphHtml);
            assert.equal(fixedHtml, paragraphHtml);
        });
    });

    describe('Correction methods', () => {
        it('can convert misused divs to paragraphs', () => {
            const badHtml = '<div>This text should not be here</div>';
            const expectedHtml = '<div><p>This text should not be here</p></div>';

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can fix isolated text blocks', () => {
            const badHtml = '<div>A block of text.<p>Next to a paragraph.</p></div>';
            const expectedHtml = '<div><p>A block of text.</p><p>Next to a paragraph.</p></div>';

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can ignore text blocks that are small', () => {
            const badHtml = '<div>div<div>div</div></div>';
            const expectedHtml = badHtml;

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can handle text blocks with special characters', () => {
            const badHtml = '<div>又到了又到了一年一度</div>';
            const expectedHtml = '<div><p>又到了又到了一年一度</p></div>';

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can convert misused inline nodes to paragraphs', () => {
            const badHtml = '<span>This is a lot of text! This should actually a p tag</span>';
            const expectedHtml = badHtml.replace(/span/g, 'p');

            const fixedHtml = HtmlProcessor.convertToParagraph('span', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can ignored well used inline nodes', () => {
            const badHtml = '<span>This is a lot of text! <div>But also children</div></span>';
            const expectedHtml = badHtml;

            const fixedHtml = HtmlProcessor.convertToParagraph('span', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can remove duplicates', () => {
            const badHtml = '<article>First.</article><article>Second.</article>';
            const expectedHtml = '<article>First.</article>';

            const fixedHtml = HtmlProcessor.removeDuplicates('article', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('only removes duplicates from the top level', () => {
            const badHtml = '<html><div><div>Hello</div></div><div>World</div></html>';
            const expectedHtml = '<html><div><div>Hello</div></div></html>';

            const fixedHtml = HtmlProcessor.removeDuplicates('div', badHtml);
            assert.equal(fixedHtml, expectedHtml);
        });

        it('can merge divs', () => {
            const badHtml = [
                '<div>',
                '<div class="merge"><p>Hello</p></div>',
                '<div class="wrapper"><div class="merge"><p>World</p></div><p>Stuff</p></div>',
                '<div class="wrapper"><div class="merge"><p>and</p><p>Friends</p></div></div>',
                '</div>',
            ].join('\n');
            const expectedHtml = [
                '<div>',
                '<div class="merge"><p>Hello</p><p>World</p><p>and</p><p>Friends</p></div>',
                '<div class="wrapper"><p>Stuff</p></div>',
                '<div class="wrapper"></div>',
                '</div>',
            ].join('\n');

            const fixedHtml = HtmlProcessor.mergeNodes('.merge', badHtml);

            assert.equal(fixedHtml, expectedHtml);
        });

        it('can propogate dir attributes', () => {
            const directionalHtml = [
                '<div class="direction" dir="rtl">',
                '<div><span><p></p></span></div>',
                '</div>',
            ].join('\n');
            const expectedHtml = [
                '<div class="direction" dir="rtl">',
                '<div><span><p dir="rtl"></p></span></div>',
                '</div>',
            ].join('\n');

            const fixedHtml = HtmlProcessor.propagateDirProperty('.direction', directionalHtml);

            assert.equal(fixedHtml, expectedHtml);
        });
    });

    describe('Image Extraction', () => {
        let scope;
        beforeEach(() => {
            scope = nock('http://test.fake');

            ['/image?size=30', '/picture.png', '/article/image.png', '/image.png'].forEach((path) => {
                scope.get(path).replyWithFile(200, `${fixturesPath}/placeholder.png`, {
                    'Content-type': 'image/png',
                });
            });
            scope.get('/bad-source').reply('404', 'Not Found');
            glob(`${outputFolder}/*.png`, (err, files) => {
                Utilities.removeFiles(files);
            });
        });

        afterEach(() => {
            glob(`${outputFolder}/*.png`, (err, files) => {
                Utilities.removeFiles(files);
            });
        });

        it('downloads images', () =>
            HtmlProcessor.extractImages(mockSection.url, mockSection.html).then((output) => {
                assert.lengthOf(output.html.match(/\.\.\/images\/.*\.png/g), 4);
                scope.isDone();
            }));

        it('saves images in the specified folder', (done) => {
            HtmlProcessor.extractImages(mockSection.url, mockSection.html)
                .then(() => {
                    fs.readdir(outputFolder, (err, files) => {
                        assert.lengthOf(files || [], 4);
                        done();
                    });
                })
                .catch(done);
        });

        it("doesn't resize small images", (done) => {
            scope = nock('http://test.fake');
            scope
                .get('/small-image.png')
                .replyWithFile(200, `${fixturesPath}/small-placeholder.png`, {
                    'Content-Type': 'image/png',
                    'Content-Length': 3000,
                });

            HtmlProcessor.extractImages(
                mockSection.url,
                '<img src="./small-image.png" style="width: 100%;">'
            )
                .then((output) => {
                    assert.notInclude(output.html, '100%');
                    done();
                })
                .catch(done);
        });

        describe('helpers', () => {
            it('can convert urls', () => {
                const root = 'http://test.fake/hello/stuff.html';
                const tests = [
                    'http://a.c/b.jpg',
                    '../img.png',
                    './img.jpg',
                    'assets/img.jpg',
                    '//cdn.com/path/image.png',
                    'image.png',
                ];
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
                const expected = ['http://test.fake/hello/image.png'];

                tests.forEach((test, idx) => {
                    assert.equal(HtmlProcessor.absolutifyUrl(root, test), expected[idx]);
                });
            });
        });
    });
});
