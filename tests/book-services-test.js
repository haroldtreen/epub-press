'use strict';

const assert = require('chai').assert;
const BookServices = require('../lib/book-services');
const Book = require('../lib/book');
const Sinon = require('sinon');
const nock = require('nock');
const fs = require('fs');

require('sinon-as-promised');

const urls = ['http://www.a.com', 'http://www.b.com'];
const html = '<html><title>HTML</title><body><p>This is great.</p><p>Hello World you</p></body></html>';
let book;

const fixturesPath = './tests/fixtures';

describe('Book Services', () => {
    beforeEach(() => {
        book = new Book({}, [{ url: urls[0] }, { url: urls[1] }]);
    });

    describe('html methods', () => {
        it('can update sections html', (done) => {
            const stub = Sinon.stub(BookServices, 'updateSectionHtml');
            stub.resolves({});

            BookServices.updateSectionsHtml(book).then(() => {
                stub.getCalls().forEach((call) => assert.include(urls, call.args[0].url));
                assert.equal(stub.callCount, 2);

                stub.restore();
                done();
            }).catch((err) => {
                stub.restore();
                done(err);
            });
        });

        it('can update section html', (done) => {
            const section = { url: urls[0] };
            nock(urls[0]).get('/').reply(200, html);

            BookServices.updateSectionHtml(section).then((updatedSection) => {
                assert.equal(updatedSection.html, section.html);

                done();
            }).catch(done);
        });

        it('will extract images', (done) => {
            const scope = nock('http://test.fake');

            [
                '/image?size=30', '/picture.png', '/article/image.png', '/image.png',
            ].forEach((path) => {
                scope.get(path).replyWithFile(
                    200,
                    `${fixturesPath}/placeholder.png`,
                    { 'Content-type': 'image/png' }
                );
            });
            const section = {
                content: fs.readFileSync(`${fixturesPath}/images.html`).toString(),
                url: 'http://test.fake/article',
            };

            BookServices.localizeSectionImages(section).then((updatedSection) => {
                assert.lengthOf(updatedSection.content.match(/\.\.\/images\/.*\.png/g), 4);
                updatedSection.images.forEach((image) => {
                    assert.match(image, /\/images\/.*\.png/);
                });
                done();
            }).catch(done);
        });
    });

    describe('extraction methods', () => {
        it('can extract sections content', (done) => {
            const stub = Sinon.stub(BookServices, 'extractSectionContent');
            const mockSection = { content: '<p>Content</p>', title: 'HTML' };
            stub.resolves(mockSection);

            BookServices.extractSectionsContent(book).then(() => {
                assert.equal(stub.callCount, book.getSections().length);

                stub.restore();
                done();
            }).catch((err) => {
                stub.restore();
                done(err);
            });
        });

        it('can extract html content', (done) => {
            const section = { html };

            BookServices.extractSectionContent(section).then((extractedSection) => {
                assert.equal(extractedSection.title, 'HTML');
                assert.include(extractedSection.content, `<h1>${extractedSection.title}</h1>`);

                done();
            }).catch(done);
        });
    });

    describe('Conversion methods', () => {
        it('can convert a books HTML to XHTL', (done) => {
            const stub = Sinon.stub(BookServices, 'convertSectionContent');
            stub.resolves({});

            BookServices.convertSectionsContent(book).then(() => {
                assert.equal(stub.callCount, book.getSections().length);

                stub.restore();
                done();
            }).catch((err) => {
                stub.restore();
                done(err);
            });
        });

        it('can convert a section HTML to XHTML', (done) => {
            const content = '<p>Hello<br>World</p>';
            const mockSection = { content };
            BookServices.convertSectionContent(mockSection).then((xhtmlSection) => {
                assert.include(xhtmlSection.xhtml, '<br />');
                assert.notInclude(xhtmlSection.xhtml, '<br>');

                done();
            }).catch(done);
        });
    });
});
