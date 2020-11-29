const { assert } = require('chai');
const db = require('../../models');

const BookModel = db.Book;

if (process.env.__SKIP_DB_TESTS__) {
    describe.only('DB Is Unavailable', () => { });
}

describe('Book Model', () => {
    afterAll(() => {
        db.sequelize.close();
    });

    const createBook = () => {
        const attrs = {
            title: 'A Test Book',
            sections: [{ title: 'Section 1', url: 'https://epub.press' }],
        };
        return BookModel.create(attrs).then(() => attrs);
    };


    it('can create books', async () => {
        const attrs = await createBook();
        const book = await BookModel.findOne({ where: { title: attrs.title } })
        Object.keys(attrs).forEach((key) => {
            expect(attrs[key]).toEqual(book[key]);
        });
        expect(typeof (book.id)).toEqual('number');
    });

    it('can read books', async () => {
        await createBook();
        const books = await BookModel.findAll();
        expect(books).toBeDefined();
        expect(books.length).toBeGreaterThan(0);
    });
});
