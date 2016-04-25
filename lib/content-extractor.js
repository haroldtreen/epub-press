'use strict';

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
                    'video,use,link,script,iframe,.hidden,.visually-hidden,.icon,.pinit,.sharethis,.wp-smiley',
                ],
                replaceWithChildren: ['noscript', 'figure'],
                filterDivs: ['popup', 'signup', 'addthis', 'sharethis'],
                replaceDivsWithChildren: [
                    'frame', 'wrapper', 'content-wrapper', 'supplemental',
                ],
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
                removeInvalidAttributes: ['body,div,p'],
                replaceWithChildren: ['article'],
            };

            const postHtml = HtmlProcessor.runHtmlOperations(html, operations);

            resolve(postHtml);
        });
    }
}

module.exports = ContentExtractor;
