'use strict';

const { assert } = require('chai');
const Sinon = require('sinon');
const TestHelpers = require('./helpers');

const Book = require('../lib/book');
const Utilities = require('../lib/utilities');

const bookMetadata = {
    title: 'Test Book',
    urls: ['http://www.a.ca', 'http://www.b.ca', 'http://www.c.ca'],
};

let book;
const title = 'Section';
const content = '<p>Some Content</p>';
const url = 'http://www.a.com/';

describe('Book', () => {
    before(() => {
        book = new Book(bookMetadata);
    });

    describe('constructor', () => {
        it('sanitizes the title', () => {
            const specialBook = new Book({ title: "Book with ' in the title" });
            assert.include(specialBook.getTitle(), '&#39;');
        });

        it('uses the current date in the title', () => {
            const untitledBook = new Book();
            assert.include(untitledBook.getTitle(), Date().slice(0, 9));
        });

        it('can be constructed with sections', () => {
            const section = { url: 'http://google.com', html: '<html></html>' };
            const sectionBook = new Book(bookMetadata, [section]);

            const sections = sectionBook.getSections();

            assert.lengthOf(sections, 1);
            assert.equal(sections[0].url, 'http://google.com');
            assert.equal(sections[0].html, '<html></html>');
        });
    });

    describe('#getId', () => {
        it('returns an id', () => {
            assert.isString(book.getId());
        });
    });

    describe('#getTitle', () => {
        it('returns titles passed to the book', () => {
            assert.equal(book.getTitle(), bookMetadata.title, 'Title not passed to book');
        });
    });

    describe('#addSection', () => {
        it('can add sections', () => {
            book.addSection({ title: 'Section 1', content });
            book.addSection({ title: 'Section 2', content });

            const sections = book.getSections();

            assert.equal(sections[sections.length - 1].title, 'Section 2');
            assert.equal(sections[sections.length - 1].content, content);
        });
    });

    describe('#getReferences', () => {
        it('returns a reference page containing all sections', () => {
            book = new Book(bookMetadata, [
                { title: 'Titled', url: 'http://google.com' },
                { url: 'http://yahoo.com' },
            ]);

            const referencesHtml = book.getReferences();

            book.getSections().forEach((section) => {
                assert.include(referencesHtml, section.title);
                assert.include(referencesHtml, section.url);
            });
        });
    });

    describe('#deleteAssets', () => {
        it('deletes files returned by #getAssets', () => {
            Sinon.stub(Utilities, 'removeFiles').resolves([]);

            const assets = book.getAssets();
            return book.deleteAssets().then((b) => {
                const removeFilesCall = Utilities.removeFiles.getCall(0);
                Utilities.removeFiles.restore();
                assert.deepEqual(removeFilesCall.args[0], assets);
                assert.lengthOf(b.getMetadata().images, 0);
                assert.equal(b.getCoverPath(), Book.DEFAULT_COVER_PATH);
            });
        });
    });

    describe('#deleteFiles', () => {
        it('deletes ebook files', () =>
            book
                .writeEpub()
                .then(() => book.deleteFiles())
                .then(() => {
                    TestHelpers.assertNoFile(book.getEpubPath());
                    TestHelpers.assertNoFile(book.getMobiPath());
                }));
    });

    describe('#writeEpub', () => {
        it('saves an epub file', () => {
            const EpubWriter = {
                writeEPUB: Sinon.spy((onErr, p, f, onSuccess) => {
                    onSuccess();
                }),
                addSection: Sinon.spy(),
                addCSS: Sinon.spy(),
            };
            const getEPUBWriterStub = Sinon.stub(Book, 'getEpubWriter').returns(EpubWriter);

            book.getSections().forEach((section) => {
                const updatedSection = section;
                updatedSection.title = 'Title';
                updatedSection.xhtml = '<div></div>';
            });

            return book.writeEpub().then(() => {
                assert.equal(EpubWriter.addSection.callCount, book.getSections().length + 1);
                assert.equal(EpubWriter.writeEPUB.callCount, 1);
                assert.equal(EpubWriter.addCSS.callCount, 1);

                getEPUBWriterStub.restore();
            });
        });
    });

    describe('.isValidSection', () => {
        it('can validate sections', () => {
            assert.isTrue(Book.isValidSection({ title, content }), 'Title and content is valid');
            assert.isTrue(Book.isValidSection({ url }), 'Url only is valid');

            assert.isFalse(Book.isValidSection({ title }), 'Content must be present');
            assert.isFalse(Book.isValidSection({ content }), 'Title must be present');
        });
    });

    describe('.fromJSON', () => {
        const reqBody = {
            title: 'A book',
            description: 'A description',
            urls: ['url1', 'url2'],
            author: 'Tom Riddle',
        };

        it('builds books from request objects', () => {
            const objBook = Book.fromJSON(reqBody);
            assert.lengthOf(objBook.getSections(), 2);
            const jsonBook = Book.fromJSON(JSON.stringify(reqBody));
            assert.lengthOf(jsonBook.getSections(), 2);
        });

        it('converts urls to sections', () => {
            const jsonBook = Book.fromJSON(reqBody);

            jsonBook.getSections().forEach((section) => {
                assert.isObject(section);
                assert.isNull(section.html);
            });
        });

        it('accepts valid metadata', () => {
            const validMetadataKeys = ['title', 'author', 'description'];

            const jsonBook = Book.fromJSON(reqBody);
            const metadata = jsonBook.getMetadata();

            validMetadataKeys.forEach((key) => {
                assert.equal(metadata[key], reqBody[key]);
            });
        });
    });

    describe('.sanitizeTitle', () => {
        it('cleans potential titles', () => {
            const generatedTitle = Book.sanitizeTitle('  Title \n');
            assert.equal(generatedTitle, 'Title');
        });
    });
});
