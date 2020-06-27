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
    }


    it('can create books', async () => {
        const attrs = await createBook();
        BookModel.findOne({ where: { title: attrs.title } })
            .then((book) => {
                Object.keys(attrs).forEach((key) => {
                    expect(attrs[key]).to.eql(book[key]);
                });
                expect(typeof(book.id)).equal('number');
            });
    });

    createBook();

    it('can read books', async () => {
        const books = await BookModel.findAll();
        expect(books).to.not.be.undefined;
        expect(books).to.not.be.empty;
    })
});
