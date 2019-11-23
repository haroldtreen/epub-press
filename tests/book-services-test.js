'use strict';

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
                expect(trackedBook).toEqual(book);
                expect(spy.called).toBe(true);
            });
        });
    });

    describe('.getStatus', () => {
        it('gets the status for a given book', () =>
            BookServices.setStatus(book, 'DEFAULT')
                .then(trackedBook => BookServices.getStatus(trackedBook))
                .then((status) => {
                    expect(typeof status.message).toBe('string');
                    expect(typeof status.progress).toBe('number');
                }));

        it('rejects when no status is set', () =>
            BookServices.getStatus(book)
                .then(() => Promise.reject(Error('.getStatus should reject.')))
                .catch(isError)
                .then((e) => {
                    expect(e.message).toContain('found');
                }));
    });

    describe('.publish', () => {
        it('calls all necessary services', () => {
            const sandbox = Sinon.createSandbox();
            const publishServices = [
                'updateSectionsHtml',
                'extractSectionsContent',
                'localizeSectionsImages',
                'convertSectionsContent',
                'createCustomCover',
                'writeEpub',
                'convertToMobi',
                'commit',
                'scheduleClean',
            ];
            publishServices.forEach((service) => {
                sandbox.stub(BookServices, service).returns(Promise.resolve(book));
            });

            return BookServices.publish(book)
                .then((publishedBook) => {
                    expect(book).toEqual(publishedBook);
                    publishServices.forEach((service) => {
                        expect(BookServices[service].calledWith(book)).toBe(true);
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
            expect(callArgs[0]).toEqual(book);
            expect(callArgs[1]).toEqual(book.getTitle());
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
                expect(writtenBook).toEqual(fakeBook);
                expect(bookSpy.calledOnce).toBe(true);
            });
        });
    });

    describe('.updateSectionsHtml', () => {
        it('calls .updateSectionHtml', (done) => {
            const stub = Sinon.stub(BookServices, 'updateSectionHtml');
            stub.resolves({});

            BookServices.updateSectionsHtml(book)
                .then(() => {
                    stub.getCalls().forEach(call => expect(urls).toContain(call.args[0].url));
                    expect(stub.callCount).toEqual(2);

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
                    expect(updatedSection.html).toEqual(section.html);

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
            scope.get('/bad-source').reply(404, 'Not Found');
            const section = {
                content: fs.readFileSync(`${fixturesPath}/images.html`).toString(),
                url: 'http://test.fake/article',
            };

            BookServices.localizeSectionImages(section)
                .then((updatedSection) => {
                    expect(updatedSection.content.match(/\.\.\/images\/.*\.png/g).length).toBe(4);
                    updatedSection.images.forEach((image) => {
                        expect(image).toMatch(/\/images\/.*\.png/);
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
                    expect(stub.callCount).toEqual(book.getSections().length);

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
                    expect(extractedSection.title).toEqual('Article');
                    expect(extractedSection.content).toContain(`<h1>${extractedSection.title}</h1>`);

                    done();
                })
                .catch(done);
        });

        it('can gracefully handle no content found', (done) => {
            const section = { html: '<html></html>', url: 'http://test.com' };

            BookServices.extractSectionContent(section)
                .then((extractedSection) => {
                    expect(extractedSection.content).toMatch(/support@epub\.press/);
                    expect(extractedSection.content).toMatch(/<h1>/);
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
                    expect(stub.callCount).toEqual(book.getSections().length);

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
                    expect(xhtmlSection.xhtml).toContain('<br />');
                    expect(xhtmlSection.xhtml).not.toContain('<br>');

                    done();
                })
                .catch(done);
        });
    });

    describe('.scheduleClean', () => {
        it('sets a timeout for calling book.deleteFiles()', () => {
            const clock = Sinon.useFakeTimers();
            Sinon.stub(book, 'deleteFiles');
            BookServices.scheduleClean(book);
            clock.tick(BookServices.CLEAN_DELAY);
            clock.restore();

            expect(book.deleteFiles.called).toBe(true);
            book.deleteFiles.restore();
        });
    });
});
