const request = require('request-promise');
const tidy = require('htmltidy2').tidy;
const readability = require('node-readability');
const async = require('async');

class Services {
    static urlsToHtml(urls) {
        const htmlPromise = new Promise((resolve, reject) => {
            async.map(urls, (url, callback) => {
                request(url).then((html) => {
                    callback(null, html);
                }).catch((error) => {
                    callback(null, `<h1>Error:</h1><p>${error.toString()}</p>`);
                });
            }, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        return htmlPromise;
    }

    static htmlToXhtml(html) {
        const xhtmlPromise = new Promise((resolve, reject) => {
            tidy(html, { outputXhtml: true, doctype: 'omit' }, (err, xhtml) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(xhtml);
                }
            });
        });

        return xhtmlPromise;
    }

    static articlesToXhtml(articles) {
        const xhtmlPromise = new Promise((resolve) => {
            async.map(articles, (article, callback) => {
                Services.htmlToXhtml(article.content).then((xhtml) => {
                    callback(null, { title: article.title, content: xhtml });
                });
            }, (err, results) => {
                resolve(results);
            });
        });
        return xhtmlPromise;
    }

    static exctractArticles(htmls) {
        const extractPromise = new Promise((resolve, reject) => {
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

        return extractPromise;
    }
}

module.exports = Services;
