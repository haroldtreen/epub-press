const nodepub = require('nodepub');
const shortid = require('shortid');
const Config = require('./config');

class Book {
    static isValidSection(section) {
        return !!((section.title && section.content) || section.url);
    }

    constructor(metadata) {
        const id = shortid.generate();
        this._metadata = Object.assign({ id }, Book.DEFAULT_METADATA, metadata);
        this._ebook = nodepub.document(this._metadata, Book.DEFAULT_COVER_PATH);
        this._sections = [];

        const urls = this._metadata.urls;

        if (urls) {
            urls.forEach((url) => {
                this._sections.push({ url });
            });
        }
    }

    getMetadata() {
        return this._metadata;
    }

    getFilename() {
        return `${this._metadata.id}`;
    }

    getTitle() {
        return this.getMetadata().title;
    }

    getUrls() {
        return this._sections.map((s) => s.url).filter((s) => s);
    }

    getSections() {
        return this._sections;
    }

    addSection(section) {
        if (Book.isValidSection(section)) {
            this.getSections().push(section);
        }
    }

    writeEpub() {
        this.getSections().forEach((section) => {
            if (section.title && section.xhtml) {
                this._ebook.addSection(section.title, section.xhtml);
            }
        });

        return new Promise((resolve, reject) => {
            this._ebook.writeEPUB(
                (err) => reject(err),
                Book.DEFAULT_EBOOK_FOLDER,
                this.getFilename(),
                () => resolve(this)
            );
        });
    }
}

Book.DEFAULT_COVER_PATH = Config.DEFAULT_COVER_PATH;
Book.DEFAULT_EBOOK_FOLDER = Config.DEFAULT_EBOOK_FOLDER;
Book.DEFAULT_METADATA = {
    title: 'Custom Ebook',
    author: 'EpubPress',
    description: 'Best. Book. Ever.',
    genre: 'Unknown',
    language: 'en',
    published: '2000-12-31',
    images: [],
};

module.exports = Book;
