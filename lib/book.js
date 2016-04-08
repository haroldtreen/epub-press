'use strict';

const shortid = require('shortid');
const Config = require('./config');
const Utilities = require('./utilities');

class Book {
    static isValidSection(section) {
        return !!((section.title && section.content) || section.url);
    }

    constructor(metadata) {
        const nodepub = require('nodepub');

        const id = shortid.generate();
        let date = Date();
        date = date.slice(0, date.match(/\d{4}/).index + 4);

        this._metadata = Object.assign({
            id,
            title: `EpubPress - ${date}`,
        }, Book.DEFAULT_METADATA, metadata);
        this._ebook = nodepub.document(this._metadata, Book.DEFAULT_COVER_PATH, this.getToc);
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

    getPath() {
        return `${Book.DEFAULT_EBOOK_FOLDER}/${this._metadata.id}`;
    }

    getEpubPath() {
        return `${this.getPath()}.epub`;
    }

    getMobiPath() {
        return `${this.getPath()}.mobi`;
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

    getToc(links) {
        const tableOfContents = ['<h2>Table Of Contents</h2>', '<ol class="toc-items">'];

        links.forEach((link) => {
            if (link.itemType === 'main') {
                tableOfContents.push(`<li><a href="${link.link}">${link.title}</a></li>`);
            }
        });

        tableOfContents.push('</ol>');

        return tableOfContents.join('\n');
    }

    writeEpub() {
        this.getSections().forEach((section) => {
            if (section.title && section.xhtml) {
                this._ebook.addSection(section.title, section.xhtml);
            }
            if (section.images && section.images.length > 0) {
                const bookImages = this.getMetadata().images;
                this.getMetadata().images = bookImages.concat(section.images);
            }
        });

        return new Promise((resolve, reject) => {
            this._ebook.images = this.getMetadata().images;
            this._ebook.writeEPUB(
                (err) => reject(err),
                Book.DEFAULT_EBOOK_FOLDER,
                this.getMetadata().id,
                () => {
                    Utilities.removeFiles(this.getMetadata().images);
                    this.getMetadata.images = [];
                    resolve(this);
                }
            );
        });
    }
}

Book.DEFAULT_COVER_PATH = Config.DEFAULT_COVER_PATH;
Book.DEFAULT_EBOOK_FOLDER = Config.DEFAULT_EBOOK_FOLDER;
Book.DEFAULT_METADATA = {
    author: 'EpubPress',
    description: 'Built using http://epub.press',
    genre: 'Unknown',
    language: 'en',
    published: '2000-12-31',
    images: [],
};

module.exports = Book;
