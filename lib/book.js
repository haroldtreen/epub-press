const nodepub = require('nodepub');
const shortid = require('shortid');

class Book {
    static isValidSection(section) {
        return !!((section.title && section.content) || section.url);
    }

    constructor(metadata) {
        this._metadata = Object.assign({}, Book.DEFAULT_METADATA, metadata);
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

Book.DEFAULT_COVER_PATH = '/Users/haroldtreen/code/web/epub-press/lib/cover.jpg';
Book.DEFAULT_EBOOK_FOLDER = '/Users/haroldtreen/code/web/epub-press/ebooks';
Book.DEFAULT_METADATA = {
    title: 'Custom Ebook',
    id: shortid.generate(),
    author: 'EpubPress',
    description: 'Best. Book. Ever.',
    genre: 'Unknown',
    images: [],
};

module.exports = Book;
