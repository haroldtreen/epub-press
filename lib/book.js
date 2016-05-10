'use strict';

const fs = require('fs');

const shortid = require('shortid');
const sanitizeHtml = require('sanitize-html');

const Config = require('./config');
const Utilities = require('./utilities');
const Url = require('url');
const BookModel = require('../models/').Book;
const Logger = require('./logger');

const log = new Logger();

class Book {
    static isValidSection(section) {
        return !!((section.title && section.content) || section.url);
    }

    static fallbackTitle(section) {
        let fallbackTitle;
        const titleMatches = section.html.match(/<title>(.*)<\/title>/i);
        if (titleMatches) {
            fallbackTitle = titleMatches[1];
        } else {
            fallbackTitle = Url.parse(section.url).host;
        }
        return fallbackTitle;
    }

    static sanitizeTitle(title) {
        let tempTitle = sanitizeHtml(title);
        tempTitle = tempTitle.trim();
        return tempTitle;
    }

    constructor(metadata, sections) {
        const nodepub = require('nodepub');
        const self = this;

        const id = shortid.generate();
        let date = Date();
        date = date.slice(0, date.match(/\d{4}/).index + 4);

        this._metadata = Object.assign({ id, title: `EpubPress - ${date}` }, Book.DEFAULT_METADATA);
        Object.keys(metadata || {}).forEach((metaKey) => {
            if (metadata[metaKey]) {
                self._metadata[metaKey] = sanitizeHtml(metadata[metaKey]).replace('\'', '&#39;');
            }
        });

        this._ebook = nodepub.document(this._metadata, Book.DEFAULT_COVER_PATH, this.getToc);

        this._sections = sections || [];
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
            this._ebook.addCSS(Book.DEFAULT_CSS);
            this._ebook.writeEPUB(
                (err) => {
                    log.exception('writeEpub')(err);
                    reject(err);
                },
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

    commit() {
        BookModel.create({
            title: this._metadata.title,
            uid: this._metadata.id,
            sections: this._sections.map((section) =>
                Object({ title: section.title, url: section.url })
            ),
        }).catch(log.exception('BookModel.create'));
    }
}

Book.DEFAULT_COVER_PATH = Config.DEFAULT_COVER_PATH;
Book.DEFAULT_CSS_PATH = Config.DEFAULT_CSS_PATH;
Book.DEFAULT_CSS = fs.readFileSync(Book.DEFAULT_CSS_PATH).toString();
Book.DEFAULT_EBOOK_FOLDER = Config.DEFAULT_EBOOK_FOLDER;
Book.DEFAULT_METADATA = {
    author: 'EpubPress',
    description: 'Built using http://epub.press',
    genre: 'Unknown',
    language: 'en',
    published: (new Date()).getFullYear(),
    images: [],
};

module.exports = Book;
