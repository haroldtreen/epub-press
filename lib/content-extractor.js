'use strict';

const HtmlProcessor = require('./html-processor');
const cheerio = require('cheerio');
const Logger = require('./logger');

const log = new Logger();

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
                ).catch(log.exception('ContentExtractor.extract'))
            );
        });
    }

    static preprocess(html) {
        return new Promise((resolve) => {
            const operations = {
                removeElement: [ContentExtractor.preprocess.REMOVE_ELEMENTS.join(',')],
                replaceWithChildren: [
                    'noscript', 'figure',
                    '.progressiveMedia', '.aspectRatioPlaceholder',
                ],
                filterDivs: ['popup', 'signup', 'addthis', 'sharethis', 'footer'],
                replaceDivsWithChildren: [
                    'frame', 'wrapper', 'content-wrapper', 'supplemental', 'row', 'section-inner',
                    'section-content',
                ],
            };

            let $ = cheerio.load(html);
            $ = HtmlProcessor.runHtmlOperations($, operations);
            resolve($.html());
        });
    }

    static process(html) {
        return new Promise((resolve) => {
            const readability = require('node-readability');
            readability(html, (error, article) => {
                if (error) {
                    log.exception('ContentExtractor.process')(error);
                }
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

ContentExtractor.preprocess.REMOVE_ELEMENTS = [
    'video',
    'use',
    'svg',
    'style',
    'select',
    'select',
    'script',
    'path',
    'link',
    'input',
    'iframe',
    'footer',
    'canvas',
    'button',
    '#stcpDiv',
    '#content-bottom',
    '.wp-smiley',
    '.visually-hidden',
    '.sidebar',
    '.sharethis',
    '.progressiveMedia-thumbnail',
    '.progressiveMedia-image',
    '.pinit',
    '.icon',
    '.hidden',
    '.block-sharethis',
];

module.exports = ContentExtractor;
