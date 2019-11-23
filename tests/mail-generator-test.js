const Book = require('../lib/book');
const MailGenerator = require('../lib/mail-generator');

const bookMetadata = {
    title: 'Book Title',
    description: 'Book Description',
};

let book;
let generator;

describe('MailGenerator', () => {
    beforeAll(() => {
        book = new Book(bookMetadata);
        generator = new MailGenerator(book);
    });

    it('uses book title in email body', () => {
        const body = generator.generateBody();

        expect(body).toContain(book.getTitle());
    });

    it('has different versions', () => {
        const body1 = generator.generateBody(0);
        const body2 = generator.generateBody(1);

        expect(body1).toContain(book.getTitle());
        expect(body2).toContain(book.getTitle());

        expect(body1).not.toEqual(body2);
    });

    it('each version is unique', () => {
        const versions = [];
        for (let i = 0; i < MailGenerator.VERSIONS_COUNT; i++) {
            versions.push(generator.generateBody(i));
        }

        versions.forEach((versionI, i) => {
            versions.forEach((versionJ, j) => {
                if (i !== j) {
                    expect(versionI).not.toEqual(versionJ);
                }
            });
        });
    });

    it('contains a donate link in each body', () => {
        for (let i = 0; i < MailGenerator.VERSIONS_COUNT; i++) {
            expect(generator.generateBody(i)).toContain('https://epub.press/#donate');
        }
    });

    it('can generate without a book', () => {
        const booklessGenerator = new MailGenerator();

        const body = booklessGenerator.generateBody();
        expect(body).toContain('EpubPress');
        expect(body).not.toContain('undefined');
    });
});
