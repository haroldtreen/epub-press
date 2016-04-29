'use strict';
const assert = require('chai').assert;
const Sinon = require('sinon');

const Book = require('../lib/book');

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

    it('has metadata', () => {
        assert.equal(book.getTitle(), bookMetadata.title, 'Title not passed to book');
    });

    it('can be saved as epub', (done) => {
        const sectionStub = Sinon.stub(book._ebook, 'addSection');
        const writeStub = Sinon.stub(book._ebook, 'writeEPUB', (onError, path, file, onSuccess) => {
            onSuccess();
        });

        book.getSections().forEach((section) => {
            const updatedSection = section;
            updatedSection.title = 'Title';
            updatedSection.xhtml = '<div></div>';
        });

        book.writeEpub().then(() => {
            assert.equal(sectionStub.callCount, book.getSections().length);
            assert.equal(writeStub.callCount, 1);

            sectionStub.restore();
            writeStub.restore();
            done();
        }).catch(done);
    });

    it('uses the current date in the title', () => {
        const untitledBook = new Book();
        assert.include(untitledBook.getTitle(), Date().slice(0, 9));
    });

    it('it can generate a title', () => {
        const generatedTitle = Book.sanitizeTitle('  Title \n');
        assert.equal(generatedTitle, 'Title');
    });

    describe('Book Sections', () => {
        it('can add sections', () => {
            book.addSection({ title: 'Section 1', content });
            book.addSection({ title: 'Section 2', content });

            const sections = book.getSections();

            assert.equal(sections[sections.length - 1].title, 'Section 2');
            assert.equal(sections[sections.length - 1].content, content);
        });

        it('can validate sections', () => {
            assert.isTrue(Book.isValidSection({ title, content }), 'Title and content is valid');
            assert.isTrue(Book.isValidSection({ url }), 'Url only is valid');

            assert.isFalse(Book.isValidSection({ title }), 'Content must be present');
            assert.isFalse(Book.isValidSection({ content }), 'Title must be present');
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
});
