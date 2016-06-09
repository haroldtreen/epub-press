const assert = require('chai').assert;

const BookModel = require('../../models/').Book;

describe('Book Model', () => {
    it('can create books', (done) => {
        const attrs = {
            title: 'A Test Book',
            sections: [{ title: 'Section 1', url: 'https://epub.press' }],
        };
        BookModel.create(attrs).then(() =>
            BookModel.findOne({ title: attrs.title })
        ).then((book) => {
            Object.keys(attrs).forEach((key) => {
                assert.deepEqual(attrs[key], book[key]);
                assert.isNumber(book.id);
            });
            done();
        }).catch(done);
    });
});
