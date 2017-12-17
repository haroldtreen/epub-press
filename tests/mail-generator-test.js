const { assert } = require('chai');

const Book = require('../lib/book');
const MailGenerator = require('../lib/mail-generator');

const bookMetadata = {
    title: 'Book Title',
    description: 'Book Description',
};

let book;
let generator;

describe('MailGenerator', () => {
    before(() => {
        book = new Book(bookMetadata);
        generator = new MailGenerator(book);
    });

    it('uses book title in email body', () => {
        const body = generator.generateBody();

        assert.include(body, book.getTitle());
    });

    it('has different versions', () => {
        const body1 = generator.generateBody(0);
        const body2 = generator.generateBody(1);

        assert.include(body1, book.getTitle());
        assert.include(body2, book.getTitle());

        assert.notEqual(body1, body2);
    });

    it('each version is unique', () => {
        const versions = [];
        for (let i = 0; i < MailGenerator.VERSIONS_COUNT; i++) {
            versions.push(generator.generateBody(i));
        }

        versions.forEach((versionI, i) => {
            versions.forEach((versionJ, j) => {
                if (i !== j) {
                    assert.notEqual(versionI, versionJ);
                }
            });
        });
    });

    it('contains a donate link in each body', () => {
        for (let i = 0; i < MailGenerator.VERSIONS_COUNT; i++) {
            assert.include(generator.generateBody(i), 'https://epub.press/#donate');
        }
    });

    it('can generate without a book', () => {
        const booklessGenerator = new MailGenerator();

        const body = booklessGenerator.generateBody();
        assert.include(body, 'EpubPress');
        assert.notInclude(body, 'undefined');
    });
});
