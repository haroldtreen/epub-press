'use strict';

const cheerio = require('cheerio');

const HtmlProcessor = require('./html-processor');

class ContentExtractor {
    static extract(html) {
        return new Promise((resolve) => {
            ContentExtractor.preprocess(html).then(
                (preHtml) => ContentExtractor.process(preHtml)
            ).then(
                (article) => ContentExtractor.postprocess(article.content || '').then(
                    (postHtml) => {
                        resolve({
                            title: article.title,
                            content: postHtml,
                        });
                    }
                ).catch((e) => { console.log(e.stack); })
            );
        });
    }

    static preprocess(html) {
        return new Promise((resolve) => {
            const operations = {
                removeElement: [
                    'link',
                    'script',
                    'iframe',
                    '.hidden',
                    '.hide',
                    '.visually-hidden',
                    '.clear',
                ],
                replaceWithChildren: ['noscript', 'figure', '.story-body-supplemental'],
                filterDivs: ['popup', 'signup', 'hidden'],
                replaceDivsWithChildren: ['frame', 'wrapper', 'content-wrapper', 'columns'],
            };

            const preHtml = HtmlProcessor.runHtmlOperations(html, operations);

            resolve(preHtml);
        });
    }

    static process(html) {
        return new Promise((resolve) => {
            const readability = require('node-readability');
            readability(html, (error, article) => {
                resolve(article);
            });
        });
    }

    static postprocess(html) {
        return new Promise((resolve) => {
            const operations = {
                maximizeSize: ['img'],
                removeInvalidAttributes: ['body', 'div', 'p'],
                replaceWithChildren: ['article'],
            };

            const postHtml = HtmlProcessor.runHtmlOperations(html, operations);

            resolve(postHtml);
        });
    }
}

module.exports = ContentExtractor;
