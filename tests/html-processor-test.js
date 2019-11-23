'use strict';

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
                expect(html).toMatch(new RegExp(`<${tag}>`));
                html = HtmlProcessor.removeElement(tag, html);
                expect(html).not.toMatch(new RegExp(`<${tag}>`));
            });
        });

        it('can bubble up tag content', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/article.html`).toString();

            expect(html).toMatch(/article/);
            const articleContents = html.match(/<article>((.|\s)*)<\/article>/m)[1];
            html = HtmlProcessor.replaceWithChildren('article', html);
            expect(html).toContain(articleContents.trim().substring(0, 20));
            expect(html).not.toMatch(/<article>/);
        });

        it('can maximize element size', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/images.html`).toString();

            expect(html).not.toMatch(/100%/);
            html = HtmlProcessor.maximizeSize('img', html);
            expect(html).toMatch(/80px/);
            expect(html).not.toMatch(/30%/);
            expect(html).toMatch(/100%/);
        });

        it('can remmove non ebook friendly attributes', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/invalid-attributes.html`).toString();

            ['srcset', 'property', 'itemprop'].forEach(attr =>
                expect(html).toMatch(new RegExp(attr)));

            html = HtmlProcessor.removeInvalidAttributes('div', html);

            ['srcset', 'property', 'itemprop'].forEach(attr =>
                expect(html).not.toMatch(new RegExp(attr)));
        });

        it('can remove divs with certain classes and ids', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/popups.html`).toString();

            html = HtmlProcessor.filterDivs('popup', html);
            expect(html).not.toMatch(/popup/);
            expect(html).toMatch(/banner/);
            expect(html).toMatch(/advertisement/);

            html = HtmlProcessor.filterDivs(['banner', 'advertisement'], html);
            expect(html).not.toMatch(/banner/);
            expect(html).not.toMatch(/advertisement/);
        });

        it('can replace divs with children', () => {
            let html = fs.readFileSync(`${__dirname}/fixtures/wrappers.html`).toString();

            html = HtmlProcessor.replaceDivsWithChildren(['wrapper'], html);
            expect(html).not.toMatch(/wrapper/);
            expect(html).toMatch(/content/);
        });

        it('can convert elements into div', () => {
            const html = HtmlProcessor.convertToDiv('section', '<section>Hello World</section>');
            expect(html).toEqual('<div>Hello World</div>');
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
                if (test.remove) {
                    expect(HtmlProcessor.removeHidden(test.selector, test.html)).not.toContain(test.selector);
                } else {
                    expect(HtmlProcessor.removeHidden(test.selector, test.html)).toContain(test.selector);
                }
            });
        });

        it('can set elements to their innerText', () => {
            let html = '<code><span>var</span> hello;</code>';
            html = HtmlProcessor.replaceWithInnerText('code', html);

            expect(html).not.toContain('<span>');
            expect(html).toContain('var hello');
        });

        it('can remove indents', () => {
            const html = ['<code>', '   if (true) {', '      hello();', '   }', '</code>'].join(
                '\n'
            );
            const expectedHtml = ['<code>', 'if (true) {', '   hello();', '}', '</code>'].join(
                '\n'
            );

            expect(HtmlProcessor.removeIndent('code', html)).toEqual(expectedHtml);
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

            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('defaults to nothing if no root found', () => {
            const nestyHtml = [
                '<html><body>',
                '<div><span>',
                '</span></div>',
                '</body></html>',
            ].join('\n');
            const fixedHtml = HtmlProcessor.setRootNode('.root', nestyHtml);

            expect(fixedHtml).toEqual(nestyHtml);
        });

        it('can remove elements with too few paragraphs', () => {
            const paragraphlessHtml = ['<article>', '<p>Hello</p>', '</article>'].join('\n');
            const fixedHtml = HtmlProcessor.filterParagraphless('article', paragraphlessHtml);
            expect(fixedHtml).toEqual('');
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
            expect(fixedHtml).toEqual(paragraphHtml);
        });
    });

    describe('Correction methods', () => {
        it('can convert misused divs to paragraphs', () => {
            const badHtml = '<div>This text should not be here</div>';
            const expectedHtml = '<div><p>This text should not be here</p></div>';

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can fix isolated text blocks', () => {
            const badHtml = '<div>A block of text.<p>Next to a paragraph.</p></div>';
            const expectedHtml = '<div><p>A block of text.</p><p>Next to a paragraph.</p></div>';

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can ignore text blocks that are small', () => {
            const badHtml = '<div>div<div>div</div></div>';
            const expectedHtml = badHtml;

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can handle text blocks with special characters', () => {
            const badHtml = '<div>又到了又到了一年一度</div>';
            const expectedHtml = '<div><p>又到了又到了一年一度</p></div>';

            const fixedHtml = HtmlProcessor.insertMissingParagraphTags('div', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can convert misused inline nodes to paragraphs', () => {
            const badHtml = '<span>This is a lot of text! This should actually a p tag</span>';
            const expectedHtml = badHtml.replace(/span/g, 'p');

            const fixedHtml = HtmlProcessor.convertToParagraph('span', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can ignored well used inline nodes', () => {
            const badHtml = '<span>This is a lot of text! <div>But also children</div></span>';
            const expectedHtml = badHtml;

            const fixedHtml = HtmlProcessor.convertToParagraph('span', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can remove duplicates', () => {
            const badHtml = '<article>First.</article><article>Second.</article>';
            const expectedHtml = '<article>First.</article>';

            const fixedHtml = HtmlProcessor.removeDuplicates('article', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('only removes duplicates from the top level', () => {
            const badHtml = '<html><div><div>Hello</div></div><div>World</div></html>';
            const expectedHtml = '<html><div><div>Hello</div></div></html>';

            const fixedHtml = HtmlProcessor.removeDuplicates('div', badHtml);
            expect(fixedHtml).toEqual(expectedHtml);
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

            expect(fixedHtml).toEqual(expectedHtml);
        });

        it('can assign the text direction', () => {
            const inputHtml = '<div>Hello World</div><div>ונתפ</div>';
            const expectedHtml = '<div>Hello World</div><div dir="rtl">ונתפ</div>';

            const fixedHtml = HtmlProcessor.assignDirProperty('div', inputHtml);

            expect(fixedHtml).toEqual(expectedHtml);
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
            scope.get('/bad-source').reply(404, 'Not Found');
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
                expect(output.html.match(/\.\.\/images\/.*\.png/g).length).toBe(4);
                scope.isDone();
            }));

        it('saves images in the specified folder', (done) => {
            HtmlProcessor.extractImages(mockSection.url, mockSection.html)
                .then(() => {
                    fs.readdir(outputFolder, (err, files) => {
                        expect((files || []).length).toBe(4);
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
                    expect(output.html).not.toContain('100%');
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
                    expect(HtmlProcessor.absolutifyUrl(root, test)).toEqual(expected[idx]);
                });
            });

            it('can resolve urls with a path', () => {
                const root = 'http://test.fake/hello/';
                const tests = ['image.png'];
                const expected = ['http://test.fake/hello/image.png'];

                tests.forEach((test, idx) => {
                    expect(HtmlProcessor.absolutifyUrl(root, test)).toEqual(expected[idx]);
                });
            });
        });
    });
});
