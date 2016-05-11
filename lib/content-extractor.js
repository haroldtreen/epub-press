'use strict';

const cheerio = require('cheerio');

const HtmlProcessor = require('./html-processor');
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
            ).catch(log.exception('ContentExtractor.extract'));
        });
    }

    static preprocess(html) {
        return new Promise((resolve) => {
            const operations = {
                removeElement: [ContentExtractor.preprocess.REMOVE_ELEMENTS.join(',')],
                removeHidden: ['span,div,aside'],
                replaceWithChildren: [
                    'noscript',
                    '.progressiveMedia', '.aspectRatioPlaceholder',
                    '.component-content',
                    '.article-body-text',
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
                removeInvalidAttributes: ['h1,h2,h3,h4,h5,h6,body,div,p,a,span,img'],
                replaceWithChildren: ['article', 'main', 'figure', 'figcaption'],
                convertToDiv: ['section', 'center', 'aside'],
                replaceWithInnerText: ['code'],
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
    'meta',
    'link',
    'input',
    'img.wp-smiley',
    'img.emoji',
    'iframe',
    'footer',
    'form',
    'canvas',
    'button',
    '#stcpDiv',
    '#sidebar',
    '#footer',
    '#fancybox',
    '#disqus_thread',
    '#content-bottom',
    '.visually-hidden',
    '.sidebar',
    '.sharethis',
    '.progressiveMedia-thumbnail',
    '.progressiveMedia-image',
    '.pinit',
    'img.lazy-loaded',
    '.icon',
    '.hidden',
    '.block-sharethis',
];

module.exports = ContentExtractor;
