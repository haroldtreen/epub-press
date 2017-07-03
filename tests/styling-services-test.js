const assert = require('chai').assert;
const Book = require('../lib/book');
const StylingService = require('../lib/styling-service');

describe('StylingService', () => {
    it('can add text to a book cover', () => {
        let book = new Book();
        const preStyledCover = book.getCoverPath();
        book = StylingService.writeOnCover(book, 'Hello World');
        const postStyledCover = book.getCoverPath();
        assert.notEqual(preStyledCover, postStyledCover);
    });
});
