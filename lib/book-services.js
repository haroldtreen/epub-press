const request = require('request-promise');
const tidy = require('htmltidy2').tidy;
const readability = require('node-readability');
const async = require('async');
const cheerio = require('cheerio');

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
        const updatedSection = section;
        return new Promise((resolve) => {
            readability(section.html, (error, article) => {
                updatedSection.title = article.title;
                updatedSection.content = `<h1>${article.title}</h1>${article.content}`;
                console.log(updatedSection.content);
                resolve(updatedSection);
            });
        });
    }

    /*
        Step 3: Remove non-ebook friendly tags
    */

    static filterSectionsContent(book) {
        book.getSections().forEach((section) => {
            BookServices.filterSectionContent(section);
        });
        return book;
    }

    static filterSectionContent(section) {
        const filteredSection = section;
        const $ = cheerio.load(filteredSection.content);

        const tagsToFilter = {
            script: 'remove',
            article: 'replaceWith',
            noscript: 'replaceWith',
            p: 'removeAttrs',
            div: 'removeAttrs'
        };

        const methods = {
            remove: (selector) => {
                $(selector).each((index, elem) => {
                    $(elem).remove();
                });
            },
            replaceWith: (selector) => {
                $(selector).each((index, elem) => {
                    $(elem).replaceWith($(elem).html());
                });
            },
            removeAttrs: (selector) => {
                const invalidAttrs = ['itemprop', 'property'];
                $(selector).each((index, elem) => {
                    invalidAttrs.forEach((attr) => {
                        $(elem).removeAttr(attr);
                    });
                });
            },
        };

        Object.keys(tagsToFilter).forEach((key) => {
            const method = tagsToFilter[key];
            methods[method](key);
        });

        filteredSection.content = $.html();
        return filteredSection;
    }

    /*
        Step 4: Convert content to XHTML
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
}

module.exports = BookServices;
