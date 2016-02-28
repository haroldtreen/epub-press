'use strict';
const assert = require('chai').assert;
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
        assert.deepEqual(book.getUrls(), bookMetadata.urls, 'Urls not passed to book');
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
    });
});
