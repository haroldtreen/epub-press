'use strict';

const fs = require('fs');

const shortid = require('shortid');
const sanitizeHtml = require('sanitize-html');

const AppErrors = require('./app-errors');
const Config = require('./config');
const Utilities = require('./utilities');
const Url = require('url');
const BookModel = require('../models/').Book;
const Logger = require('./logger');

const log = new Logger();

class Book {
    static find(id, filetype) {
        return new Promise((resolve, reject) => {
            BookModel.findOne({ where: { uid: id } }).then((bookModel) => {
                if (!bookModel) {
                    return reject(AppErrors.getApiError('BOOK_NOT_FOUND'));
                }

                const book = new Book({ id: bookModel.uid, title: bookModel.title });
                const path = filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();

                return fs.stat(path, (err) => {
                    if (err) {
                        reject(AppErrors.getApiError('BOOK_NOT_FOUND'));
                    } else {
                        resolve(book);
                    }
                });
            });
        });
    }

    static isValidSection(section) {
        return !!((section.title && section.content) || section.url);
    }

    static fallbackTitle(section) {
        let fallbackTitle;
        const titleMatches = section.html.match(/<title>(.*?)<\/title>/i);
        if (titleMatches) {
            fallbackTitle = titleMatches[1];
        }

        fallbackTitle = fallbackTitle || Url.parse(section.url).host;
        return Book.sanitizeTitle(fallbackTitle);
    }

    static replaceCharacters(string) {
        let replacedString = string;
        const REPLACEMENTS = {
            "'": '&#39;',
        };

        Object.keys(REPLACEMENTS).forEach((oldChar) => {
            const newChar = REPLACEMENTS[oldChar];
            replacedString = replacedString.replace(oldChar, newChar);
        });
        return replacedString;
    }

    static sanitizeTitle(title) {
        let tempTitle = sanitizeHtml(title);
        tempTitle = tempTitle.trim();

        if (tempTitle.length > Book.MAX_TITLE_LENGTH) {
            tempTitle = `${tempTitle.substring(0, Book.MAX_TITLE_LENGTH - 3)}...`;
        }

        return tempTitle;
    }

    static fromJSON(json) {
        let reqBody = json;
        if (typeof reqBody === 'string') {
            reqBody = JSON.parse(json);
        }
        const attrs = reqBody;
        let sections = attrs.sections;
        if (!sections) {
            sections = attrs.urls.map(url => ({ url, html: null }));
        }

        return new Book(
            {
                title: attrs.title,
                description: attrs.description,
                author: attrs.author,
            },
            sections
        );
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
                self._metadata[metaKey] = Book.replaceCharacters(sanitizeHtml(metadata[metaKey]));
            }
        });

        this._ebook = nodepub.document(this._metadata, Book.DEFAULT_COVER_PATH, this.getToc);

        this._sections = sections || [];
    }

    getMetadata() {
        return this._metadata;
    }

    getPath() {
        return `${Book.DEFAULT_EBOOK_FOLDER}/${this.getId()}`;
    }

    getEpubPath() {
        return `${this.getPath()}.epub`;
    }

    getMobiPath() {
        return `${this.getPath()}.mobi`;
    }

    getCoverPath() {
        return this.getMetadata().coverPath;
    }

    setCoverPath(path) {
        this._metadata.coverPath = path;
    }

    getId() {
        return this.getMetadata().id;
    }

    getTitle() {
        return this.getMetadata().title;
    }

    getUrls() {
        return this._sections.map(s => s.url).filter(s => s);
    }

    getSections() {
        return this._sections;
    }

    addSection(section) {
        if (Book.isValidSection(section)) {
            this.getSections().push(section);
        }
    }

    getReferences() {
        const referencesHtml = ['<h2>References</h2>', '<ol class="references-items">'];

        this.getSections().forEach((section) => {
            const host = Url.parse(section.url).hostname;
            const ref = `<li><a href="${section.url}">${section.title} (${host})</a></li>`;
            referencesHtml.push(ref);
        });

        referencesHtml.push('</ol>');
        return referencesHtml.join('\n');
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

        const referencesHtml = this.getReferences();
        this._ebook.addSection('References', referencesHtml);

        this.getMetadata().images = [...new Set(this.getMetadata().images)];

        return new Promise((resolve, reject) => {
            this._ebook.images = this.getMetadata().images;
            this._ebook.metadata = this.getMetadata();
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
        return new Promise((resolve, reject) => {
            BookModel.create({
                title: this._metadata.title,
                uid: this._metadata.id,
                sections: this._sections.map(section =>
                    Object({ title: section.title, url: section.url })
                ),
            })
                .then(() => {
                    resolve(this);
                })
                .catch((err) => {
                    log.exception('BookModel.create')(err);
                    reject(this);
                });
        });
    }
}

Book.MAX_TITLE_LENGTH = 125;
Book.DEFAULT_COVER_PATH = Config.DEFAULT_COVER_PATH;
Book.DEFAULT_CSS_PATH = Config.DEFAULT_CSS_PATH;
Book.DEFAULT_CSS = fs.readFileSync(Book.DEFAULT_CSS_PATH).toString();
Book.DEFAULT_EBOOK_FOLDER = Config.DEFAULT_EBOOK_FOLDER;
Book.DEFAULT_METADATA = {
    author: 'EpubPress',
    description: 'Built using https://epub.press',
    genre: 'Unknown',
    language: 'en',
    published: new Date().getFullYear(),
    images: [],
};

module.exports = Book;
