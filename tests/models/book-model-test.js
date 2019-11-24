const db = require('../../models');

const BookModel = db.Book;

if (process.env.__SKIP_DB_TESTS__) {
    describe.only('DB Is Unavailable', () => { });
}

describe('Book Model', () => {
    afterAll(() => {
        db.sequelize.close();
    });

    it('can create books', () => {
        const attrs = {
            title: 'A Test Book',
            sections: [{ title: 'Section 1', url: 'https://epub.press' }],
        };
        return BookModel.create(attrs)
            .then(() => BookModel.findOne({ where: { title: attrs.title } }))
            .then((book) => {
                Object.keys(attrs).forEach((key) => {
                    expect(attrs[key]).toEqual(book[key]);
                    expect(typeof book.id).toBe('number');
                });
            });
    });
});
