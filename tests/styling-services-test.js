const assert = require('chai').assert;

const fs = require('fs-extra');

const Book = require('../lib/book');
const StylingService = require('../lib/styling-service');

function assertDifferentFile(path1, path2) {
    assert.notEqual(path1, path2);
    assert.isTrue(fs.pathExistsSync(path1));
    assert.isTrue(fs.pathExistsSync(path2));
}

describe('StylingService', () => {
    it('can add text to a book cover', () => {
        const book = new Book({ title: 'This is a book' });
        const preStyledCover = book.getCoverPath();
        return StylingService.writeOnCover(book, 'Hello World').then((updatedBook) => {
            const postStyledCover = updatedBook.getCoverPath();
            assertDifferentFile(preStyledCover, postStyledCover);
        });
    });
});
