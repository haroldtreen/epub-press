const request = require('request-promise');
const tidy = require('htmltidy2').tidy;
const readability = require('node-readability');
const async = require('async');

class BookServices {
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

    static htmlToXhtml(html) {
        return new Promise((resolve, reject) => {
            tidy(html, { outputXhtml: true, doctype: 'omit' }, (err, xhtml) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(xhtml);
                }
            });
        });
    }

    static articlesToXhtml(articles) {
        return new Promise((resolve) => {
            async.map(articles, (article, callback) => {
                BookServices.htmlToXhtml(article.content).then((xhtml) => {
                    callback(null, { title: article.title, content: xhtml });
                });
            }, (err, results) => {
                resolve(results);
            });
        });
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
        const updatedSection = section;
        return new Promise((resolve) => {
            readability(section.html, (error, article) => {
                updatedSection.title = article.title;
                updatedSection.content = `<h1>${article.title}</h1>${article.content}`;
                console.log(updatedSection);
                resolve(updatedSection);
            });
        });
    }

    static extractArticles(htmls) {
        return new Promise((resolve, reject) => {
            async.map(htmls, (html, callback) => {
                readability(html, (error, article) => {
                    callback(null, article);
                });
            }, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports = BookServices;
