'use strict';

const fs = require('fs');

const shortid = require('shortid');
const sanitizeHtml = require('sanitize-html');

const Url = require('url');
const { VALID_BOOK_METADATA_KEYS } = require('./constants');
const AppErrors = require('./app-errors');
const Config = require('./config');
const Utilities = require('./utilities');
const BookModel = require('../models').Book;
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

    static isValidMetadataKey(key) {
        return VALID_BOOK_METADATA_KEYS.includes(key);
    }

    static assertIsValidMetadataKey(key) {
        if (!Book.isValidMetadataKey(key)) {
            throw AppErrors.invalidBookKey(key);
        }
    }

    static fallbackTitle(section) {
        let fallbackTitle;
        const titleMatches = section.html.match(/<title>(.*?)<\/title>/i);
        if (titleMatches) {
            [, fallbackTitle] = titleMatches;
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

    static getEpubWriter(metadata) {
        // eslint-disable-next-line
        const nodepub = require('nodepub');
        return nodepub.document(
            metadata,
            metadata.coverPath || Book.DEFAULT_COVER_PATH,
            Book.getToc
        );
    }

    static getToc(links) {
        const tableOfContents = ['<h2>Table Of Contents</h2>', '<ol class="toc-items">'];

        links.forEach((link) => {
            if (link.itemType === 'main') {
                tableOfContents.push(`<li><a href="${link.link}">${link.title}</a></li>`);
            }
        });

        tableOfContents.push('</ol>');

        return tableOfContents.join('\n');
    }

    /**
     * A book
     * @typedef {Object} Book
     * @property {string} author - the authof of the book (default: EpubPress)
     * @property {string} coverPath - (optional) http(s) link to an
     *  image for the cover of the book (816x1056)
     * @property {string} description - description of book
     *  (default: 'Built using https://epub.press')
     * @property {string} genre - the genre of the book  (default: Unknown)
     * @property {string} language - the languages of the book (default: en)
     * @property {string} title - title of book
     * @property {number} published - publish Date (default: today)
     * @property {string} publisher - publisher (default: https://epub.press)
     * @property {Object[]} sections - collection of sections for the book.
     *  A section include a title and (html) content OR a url. Mutually exclusive with urls
     * @property {string} series - the series - used in Calibre (default: '')
     * @property {number} sequence - the sequence - used in Calibre (default: '')
     * @property {string} tags - (optional) a CSV list of strings that become
     *  tags/subject for the book (default: empty)
     * @property {string[]} urls - collection of sites to transform and add as sections
     *  to the book. Mutually exclusive with section
     */

    /**
     * Create a book from json
     * @param {Book} book - The {@link Book} to be created
     */
    static fromJSON(json) {
        let reqBody = json;
        if (typeof reqBody === 'string') {
            reqBody = JSON.parse(json);
        }
        const attrs = reqBody;
        let { sections } = attrs;
        if (!sections) {
            sections = attrs.urls.map((url) => ({ url, html: null }));
        }

        return new Book(attrs, sections);
    }

    constructor(metadata, sections) {
        const id = shortid.generate();
        let date = Date();
        date = date.slice(0, date.match(/\d{4}/).index + 4);

        this._metadata = { id, title: `EpubPress - ${date}`, ...Book.DEFAULT_METADATA };
        Object.keys(metadata || {})
            .filter((key) => metadata[key])
            .forEach((metaKey) => {
                // these properties can come in with metadata, but are not the same
                // metadata that is passed to nodepub
                if (metaKey !== 'sections' && metaKey !== 'urls') {
                    Book.assertIsValidMetadataKey(metaKey);
                }
                this._metadata[metaKey] = Book.replaceCharacters(sanitizeHtml(metadata[metaKey]));
            });

        const coverPath = this.getCoverPath();

        if (coverPath !== Book.DEFAULT_COVER_PATH && !coverPath.startsWith('http')) {
            throw AppErrors.api.COVER_PATH_INVALID;
        }

        this._sections = sections || [];
    }

    /**
     * @returns metadata used to generate the book in the ebpub library, nodepub
     * @see https://github.com/kcartlidge/nodepub#creating-your-content for details
     */
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

    /**
     *  @returns path to cover image of the book
     */
    getCoverPath() {
        return this.getMetadata().coverPath || Book.DEFAULT_COVER_PATH;
    }

    hasDefaultCover() {
        return this.getCoverPath() === Book.DEFAULT_COVER_PATH;
    }

    getTags() {
        return this.getMetadata().tags || '';
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
        return this._sections.map((s) => s.url).filter((s) => s);
    }

    getSections() {
        return this._sections;
    }

    getAssets() {
        const { images } = this.getMetadata();
        const coverPath = this.getCoverPath();
        if (coverPath !== Book.DEFAULT_COVER_PATH) {
            return images.concat(coverPath);
        }
        return images;
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

    deleteAssets() {
        return new Promise((resolve, reject) => {
            Utilities.removeFiles(this.getAssets())
                .then(() => resolve(this))
                .catch(reject);
            this.getMetadata().images = [];
        });
    }

    deleteFiles() {
        const files = [this.getMobiPath(), this.getEpubPath()];
        return Utilities.removeFiles(files);
    }

    writeEpub() {
        this._ebook = Book.getEpubWriter(this.getMetadata());

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
                    this.deleteAssets();
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
                sections: this._sections.map((section) => ({
                    title: section.title,
                    url: section.url,
                })),
            })
                .then(() => {
                    resolve(this);
                })
                .catch((err) => {
                    log.exception('BookModel.create')(err);
                    reject(err);
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
    publisher: 'https://epub.press',
    series: '',
    sequence: undefined,
    images: [],
    tags: '',
};

module.exports = Book;
