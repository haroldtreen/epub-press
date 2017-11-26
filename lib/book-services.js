'use strict';

const { exec } = require('child_process');
const request = require('request-promise').defaults({ gzip: true });
const { tidy } = require('htmltidy2');
const Promise = require('bluebird');

const Config = require('./config');
const AppErrors = require('./app-errors');
const Book = require('./book');
const ContentExtractor = require('./content-extractor');
const HtmlProcessor = require('./html-processor');
const ResultsValidator = require('./results-validator');
const Logger = require('./logger');
const StatusTracker = require('./status-tracker');
const StylingService = require('./styling-service');

const tracker = new StatusTracker();
const { STATUS_TYPES } = StatusTracker;
const log = new Logger();

class BookServices {
    /*
        High level methods
    */

    static setStatus(book, statusType) {
        return new Promise((resolve) => {
            tracker.setStatus(book.getId(), statusType); // Book might be undefined?
            resolve(book);
        });
    }

    static getStatus(book) {
        return new Promise((resolve, reject) => {
            const status = tracker.getStatus(book.getId());
            if (status) {
                resolve(status);
            } else {
                reject(AppErrors.getApiError('NOT_FOUND'));
            }
        });
    }

    static publish(book) {
        return BookServices.setStatus(book, STATUS_TYPES.PUBLISHING)
            .then(BookServices.updateSectionsHtml)
            .then(BookServices.extractSectionsContent)
            .then(BookServices.localizeSectionsImages)
            .then(BookServices.convertSectionsContent)
            .then(BookServices.createCustomCover)
            .then(BookServices.writeEpub)
            .then(BookServices.convertToMobi)
            .then(BookServices.commit)
            .then(BookServices.scheduleClean)
            .then(finishedBook => BookServices.setStatus(finishedBook, STATUS_TYPES.DONE))
            .catch((error) => {
                BookServices.setStatus(book, STATUS_TYPES.FAILED);
                return Promise.reject(error);
            });
    }

    /*
        Step 1: Download sections HTML
    */

    static updateSectionsHtml(book) {
        tracker.setStatus(book.getId(), STATUS_TYPES.FETCHING_HTML);
        const sections = book.getSections();
        return new Promise((resolve) => {
            Promise.all(sections.map(section => BookServices.updateSectionHtml(section)))
                .then(() => resolve(book))
                .catch(log.exception('BookServices.updateSectionsHtml'));
        });
    }

    static updateSectionHtml(section) {
        const updatedSection = section;
        return new Promise((resolve) => {
            if (section.url && !section.html) {
                request(section.url)
                    .then((html) => {
                        updatedSection.html = html;
                        resolve(updatedSection);
                    })
                    .catch((error) => {
                        log.exception('BookServices.updateSectionHtml')(error);
                        updatedSection.html = `<h1>Error:</h1><p>${error.toString()}</p>`;
                        resolve(updatedSection);
                    });
            } else {
                resolve(updatedSection);
            }
        });
    }

    /*
        Step 2: Extract content from HTML
    */

    static setArticleContent(article, section) {
        const updatedSection = section;

        const articleTitle = article.title && article.title.trim();

        updatedSection.title = articleTitle || Book.fallbackTitle(section);
        updatedSection.title = Book.sanitizeTitle(updatedSection.title);
        updatedSection.content = `<h1>${updatedSection.title}</h1>`;
        updatedSection.content += `${article.content}`;

        return updatedSection;
    }

    static setErrorContent(section) {
        const updatedSection = section;

        updatedSection.title = Book.fallbackTitle(section);
        updatedSection.content = '<h1>Oops! No content found.</h1>';
        updatedSection.content += [
            `<p>We looked for content in ${section.url} but couldn't find anything :(.</p>`,
            '<p>Try making sure all your tabs have fully loaded before downloding your book.</p>',
            '<p>Feel free to email support@epub.press if you need help.</p>',
        ].join('\n');

        return updatedSection;
    }

    static extractSectionsContent(book) {
        tracker.setStatus(book.getId(), STATUS_TYPES.EXTRACTING_CONTENT);
        return new Promise((resolve) => {
            Promise.map(
                book.getSections(),
                section => BookServices.extractSectionContent(section),
                { concurrency: BookServices.CONCURRENCY }
            )
                .then(() => resolve(book))
                .catch(log.exception('BookServices.extractSectionsContent'));
        });
    }

    static extractSectionContent(section) {
        return new Promise((resolve) => {
            ContentExtractor.runUrlSpecificOperations(section.html, section.url)
                .then(html => ContentExtractor.extract(html))
                .then((article) => {
                    let updatedSection;
                    if (article && article.content) {
                        updatedSection = BookServices.setArticleContent(article, section);
                        const resultsValidator = new ResultsValidator(updatedSection);
                        resultsValidator.validate();
                    } else {
                        log.warn('No article found', { url: section.url });
                        updatedSection = BookServices.setErrorContent(section);
                    }

                    resolve(updatedSection);
                })
                .catch(log.exception('BookServices.extractSectionContent'));
        });
    }

    /*
        Step 3: Localize images
    */

    static localizeSectionsImages(book) {
        tracker.setStatus(book.getId(), STATUS_TYPES.FETCHING_IMAGES);
        return new Promise((resolve) => {
            Promise.all(book.getSections().map(BookServices.localizeSectionImages))
                .then(() => resolve(book))
                .catch(log.exception('BookServices.localizeSectionsImages'));
        });
    }

    static localizeSectionImages(section) {
        return new Promise((resolve) => {
            const filteredSection = section;
            HtmlProcessor.extractImages(section.url, section.content)
                .then((extractedImages) => {
                    filteredSection.content = extractedImages.html;
                    filteredSection.images = extractedImages.images;
                    resolve(filteredSection);
                })
                .catch(log.exception('BookServices.localizeSectionImages'));
        });
    }

    /*
        Step 4: Convert content to XHTML
    */

    static convertSectionsContent(book) {
        tracker.setStatus(book.getId(), STATUS_TYPES.FORMATTING_HTML);
        const sections = book.getSections();
        return new Promise((resolve) => {
            Promise.all(sections.map(section => BookServices.convertSectionContent(section)))
                .then(() => resolve(book))
                .catch(log.exception('BookServices.convertSectionsContent'));
        });
    }

    static convertSectionContent(section) {
        const updatedSection = section;
        return new Promise((resolve, reject) => {
            tidy(
                section.content,
                {
                    outputXhtml: true,
                    doctype: 'omit',
                    showBodyOnly: true,
                    dropEmptyElements: true,
                },
                (err, xhtml) => {
                    if (err) {
                        log.exception('BookServices.convertSectionContent')(err);
                        reject(err);
                    } else {
                        updatedSection.xhtml = xhtml;
                        resolve(section);
                    }
                }
            );
        });
    }

    /*
        Step 6: Create a custom cover
    */

    static createCustomCover(book) {
        tracker.setStatus(book.getId(), STATUS_TYPES.CREATING_COVER);
        return StylingService.writeOnCover(book, book.getTitle());
    }

    /*
        Step 5: Write Epub
    */

    static writeEpub(book) {
        tracker.setStatus(book.getId(), STATUS_TYPES.WRITING_EBOOK);
        return new Promise((resolve, reject) => {
            book
                .writeEpub()
                .then(() => {
                    resolve(book);
                })
                .catch((e) => {
                    log.exception('BookServices.writeEpub')(e);
                    reject(e);
                });
        });
    }

    /*
        Step 6: Convert to .mobi
    */

    static convertToMobi(book) {
        return new Promise((resolve, reject) => {
            exec(`${Config.KINDLEGEN} "${book.getEpubPath()}"`, (error) => {
                if (error && error.code > 1) {
                    log.exception('BookServices.convertToMobi')(error);
                    reject(error);
                } else {
                    resolve(book);
                }
            });
        });
    }

    /*
        Step 7: Commit to DB
    */

    static commit(book) {
        return new Promise((resolve, reject) => {
            book
                .commit()
                .then(() => {
                    resolve(book);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /*
        Step 8: Schedule Clean
    */

    static scheduleClean(book) {
        setTimeout(() => {
            book.deleteFiles();
        }, BookServices.CLEAN_DELAY);
        return Promise.resolve();
    }
}

BookServices.CLEAN_DELAY = 1000 * 60 * 5; // 5 minutes
BookServices.CONCURRENCY = 1;

module.exports = BookServices;
