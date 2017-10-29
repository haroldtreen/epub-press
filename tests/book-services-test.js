'use strict';

const { assert } = require('chai');
const Sinon = require('sinon');
const nock = require('nock');
const fs = require('fs');

const Book = require('../lib/book');
const BookServices = require('../lib/book-services');
const StatusTracker = require('../lib/status-tracker');
const StylingService = require('../lib/styling-service');
const { isError } = require('./helpers');

const urls = ['http://www.a.com', 'http://www.b.com'];
const html = fs.readFileSync(`${__dirname}/fixtures/article.html`).toString();
let book;

const fixturesPath = './tests/fixtures';

describe('Book Services', () => {
    beforeEach(() => {
        book = new Book({}, [{ url: urls[0] }, { url: urls[1] }]);
    });

    describe('.setStatus', () => {
        it('sets a status for a given book', () => {
            const spy = Sinon.spy(StatusTracker.prototype, 'setStatus');
            return BookServices.setStatus(book, 'PUBLISHING').then((trackedBook) => {
                assert.equal(trackedBook, book);
                assert.isTrue(spy.called);
            });
        });
    });

    describe('.getStatus', () => {
        it('gets the status for a given book', () =>
            BookServices.setStatus(book, 'DEFAULT')
                .then(trackedBook => BookServices.getStatus(trackedBook))
                .then((status) => {
                    assert.isString(status.message);
                    assert.isNumber(status.progress);
                }));

        it('rejects when no status is set', () =>
            BookServices.getStatus(book)
                .then(() => Promise.reject(Error('.getStatus should reject.')))
                .catch(isError)
                .then((e) => {
                    assert.include(e.message, 'found');
                }));
    });

    describe('.publish', () => {
        it('calls all necessary services', () => {
            const sandbox = Sinon.sandbox.create();
            const publishServices = [
                'updateSectionsHtml',
                'extractSectionsContent',
                'localizeSectionsImages',
                'convertSectionsContent',
                'createCustomCover',
                'writeEpub',
                'convertToMobi',
                'commit',
            ];
            publishServices.forEach((service) => {
                sandbox.stub(BookServices, service).returns(Promise.resolve(book));
            });

            return BookServices.publish(book)
                .then((publishedBook) => {
                    assert.equal(book, publishedBook);
                    publishServices.forEach((service) => {
                        assert.isTrue(
                            BookServices[service].calledWith(book),
                            `${service} not called`
                        );
                    });
                    sandbox.restore();
                })
                .catch((err) => {
                    sandbox.restore();
                    return Promise.reject(err);
                });
        });
    });

    describe('.createCustomCover', () => {
        it('calls writeOnCover with the book title', () => {
            book = new Book();
            const writeOnCoverStub = Sinon.stub(StylingService, 'writeOnCover');

            BookServices.createCustomCover(book);
            writeOnCoverStub.restore();
            const callArgs = writeOnCoverStub.firstCall.args;
            assert.equal(callArgs[0], book);
            assert.equal(callArgs[1], book.getTitle());
        });
    });

    describe('.writeEpub', () => {
        it('calls writeEpub on the book', () => {
            const fakeBook = {
                getId: () => 1,
                writeEpub() {
                    return Promise.resolve();
                },
            };
            const bookSpy = Sinon.spy(fakeBook, 'writeEpub');

            return BookServices.writeEpub(fakeBook).then((writtenBook) => {
                assert.equal(writtenBook, fakeBook);
                assert.isTrue(bookSpy.calledOnce);
            });
        });
    });

    describe('.updateSectionsHtml', () => {
        it('calls .updateSectionHtml', (done) => {
            const stub = Sinon.stub(BookServices, 'updateSectionHtml');
            stub.resolves({});

            BookServices.updateSectionsHtml(book)
                .then(() => {
                    stub.getCalls().forEach(call => assert.include(urls, call.args[0].url));
                    assert.equal(stub.callCount, 2);

                    stub.restore();
                    done();
                })
                .catch((err) => {
                    stub.restore();
                    done(err);
                });
        });
    });

    describe('.updateSectionHtml', () => {
        it('download the html for every section', (done) => {
            const section = { url: urls[0] };
            nock(urls[0])
                .get('/')
                .reply(200, html);

            BookServices.updateSectionHtml(section)
                .then((updatedSection) => {
                    assert.equal(updatedSection.html, section.html);

                    done();
                })
                .catch(done);
        });
    });

    describe('.localizeSectionImages', () => {
        it('downloads images referenced in html', (done) => {
            const scope = nock('http://test.fake');

            ['/image?size=30', '/picture.png', '/article/image.png', '/image.png'].forEach((path) => {
                scope.get(path).replyWithFile(200, `${fixturesPath}/placeholder.png`, {
                    'Content-type': 'image/png',
                });
            });
            scope.get('/bad-source').reply('404', 'Not Found');
            const section = {
                content: fs.readFileSync(`${fixturesPath}/images.html`).toString(),
                url: 'http://test.fake/article',
            };

            BookServices.localizeSectionImages(section)
                .then((updatedSection) => {
                    assert.lengthOf(updatedSection.content.match(/\.\.\/images\/.*\.png/g), 4);
                    updatedSection.images.forEach((image) => {
                        assert.match(image, /\/images\/.*\.png/);
                    });
                    done();
                })
                .catch(done);
        });
    });

    describe('.extractSectionsContent', () => {
        it('can extract sections content', (done) => {
            const stub = Sinon.stub(BookServices, 'extractSectionContent');
            const mockSection = { content: '<p>Content</p>', title: 'HTML' };
            stub.resolves(mockSection);

            BookServices.extractSectionsContent(book)
                .then(() => {
                    assert.equal(stub.callCount, book.getSections().length);

                    stub.restore();
                    done();
                })
                .catch((err) => {
                    stub.restore();
                    done(err);
                });
        });
    });

    describe('.extractSectionContent', () => {
        it('can extract html content', (done) => {
            const section = { html, url: 'http://test.com' };

            BookServices.extractSectionContent(section)
                .then((extractedSection) => {
                    assert.equal(extractedSection.title, 'Article');
                    assert.include(extractedSection.content, `<h1>${extractedSection.title}</h1>`);

                    done();
                })
                .catch(done);
        });

        it('can gracefully handle no content found', (done) => {
            const section = { html: '<html></html>', url: 'http://test.com' };

            BookServices.extractSectionContent(section)
                .then((extractedSection) => {
                    assert.match(extractedSection.content, /support@epub\.press/);
                    assert.match(extractedSection.content, /<h1>/);
                    done();
                })
                .catch(done);
        });
    });

    describe('.convertSectionsContent', () => {
        it('can convert a books HTML to XHTL', (done) => {
            const stub = Sinon.stub(BookServices, 'convertSectionContent');
            stub.resolves({});

            BookServices.convertSectionsContent(book)
                .then(() => {
                    assert.equal(stub.callCount, book.getSections().length);

                    stub.restore();
                    done();
                })
                .catch((err) => {
                    stub.restore();
                    done(err);
                });
        });
    });

    describe('.convertSectionContent', () => {
        it('can convert a section HTML to XHTML', (done) => {
            const content = '<p>Hello<br>World</p>';
            const mockSection = { content };
            BookServices.convertSectionContent(mockSection)
                .then((xhtmlSection) => {
                    assert.include(xhtmlSection.xhtml, '<br />');
                    assert.notInclude(xhtmlSection.xhtml, '<br>');

                    done();
                })
                .catch(done);
        });
    });
});
