'use strict';

const exec = require('child_process').exec;

const request = require('request-promise').defaults({ gzip: true });
const Config = require('./config');
const HtmlProcessor = require('./html-processor');
const Book = require('./book');
const ContentExtractor = require('./content-extractor');

class BookServices {
    /*
        Step 1: Download sections HTML
    */

    static updateSectionsHtml(book) {
        const sections = book.getSections();
        return new Promise((resolve) => {
            Promise.all(
                sections.map((section) => BookServices.updateSectionHtml(section))
            ).then(
                () => resolve(book)
            );
        });
    }

    static updateSectionHtml(section) {
        const updatedSection = section;
        return new Promise((resolve) => {
            if (section.url && !section.html) {
                request(section.url).then((html) => {
                    updatedSection.html = html;
                    resolve(updatedSection);
                }).catch((error) => {
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
        updatedSection.title = article.title || Book.fallbackTitle(section);
        updatedSection.title = Book.sanitizeTitle(updatedSection.title);
        updatedSection.description = article.description;
        updatedSection.content = `<h1>${updatedSection.title}</h1>`;

        if (article.content) {
            updatedSection.content += `${article.content}`;
        } else {
            updatedSection.content += '<p>No content found for this page :(.</p>';
        }
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
        return new Promise((resolve) => {
            Promise.all(
                book.getSections().map((section) => BookServices.extractSectionContent(section))
            ).then(
                () => resolve(book)
            );
        });
    }

    static extractSectionContent(section) {
        return new Promise((resolve) => {
            ContentExtractor.parse(section.url, section.html).then((article) => {
                let updatedSection;
                if (article) {
                    updatedSection = BookServices.setArticleContent(article, section);
                } else {
                    updatedSection = BookServices.setErrorContent(section);
                }

                resolve(updatedSection);
            }).catch((e) => {
                console.log(e.stack);
            });
        });
    }

    /*
        Step 3: Remove non-ebook friendly tags
    */

    static filterSectionsContent(book) {
        book.getSections().forEach((section) => {
            const filteredSection = section;
            filteredSection.content = HtmlProcessor.cleanTags(section.content);
        });
        return book;
    }

    /*
        Step 4: Localize images
    */

    static localizeSectionsImages(book) {
        return new Promise((resolve) => {
            Promise.all(
                book.getSections().map((section) => BookServices.localizeSectionImages(section))
            ).then(
                () => resolve(book)
            ).catch(console.log);
        });
    }

    static localizeSectionImages(section) {
        return new Promise((resolve) => {
            const filteredSection = section;
            HtmlProcessor.extractImages(section.url, section.content).then((extractedImages) => {
                filteredSection.content = extractedImages.html;
                filteredSection.images = extractedImages.images;
                resolve(filteredSection);
            }).catch(console.log);
        });
    }

    /*
        Step 5: Convert content to XHTML
    */

    static convertSectionsContent(book) {
        const sections = book.getSections();
        return new Promise((resolve) => {
            Promise.all(
                sections.map((section) => BookServices.convertSectionContent(section))
            ).then(
                () => resolve(book)
            ).catch(console.log);
        });
    }

    static convertSectionContent(section) {
        const updatedSection = section;
        return new Promise((resolve, reject) => {
            const tidy = require('htmltidy2').tidy;
            tidy(section.content,
                { outputXhtml: true, doctype: 'omit', showBodyOnly: true, dropEmptyElements: true },
                (err, xhtml) => {
                    if (err) {
                        console.log(err);
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
        Step 6 (Optional): Convert to .mobi
    */

    static convertToMobi(book) {
        return new Promise((resolve, reject) => {
            exec(`${Config.KINDLEGEN} "${book.getEpubPath()}"`, (error) => {
                if (error && error.code > 1) {
                    reject(error);
                } else {
                    resolve(book);
                }
            });
        });
    }
}

module.exports = BookServices;
