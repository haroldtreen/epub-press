const BookModel = require('../../models/').Book;

describe('Book Model', () => {
    it('can create books', (done) => {
        const attrs = {
            title: 'A Test Book',
            sections: [{ title: 'Section 1', url: 'https://epub.press' }],
        };
        BookModel.create(attrs)
            .then(() => BookModel.findOne({ where: { title: attrs.title } }))
            .then((book) => {
                Object.keys(attrs).forEach((key) => {
                    expect(attrs[key]).toEqual(book[key]);
                    expect(typeof book.id).toBe('number');
                });
                done();
            })
            .catch(done);
    });
});
