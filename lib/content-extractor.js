'use strict';
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
                filterDivs: ['popup', 'signup', 'addthis', 'sharethis', 'tool', '-list', 'player'],
                removeHidden: ['span,div,aside,li'],
                removeDuplicates: ['article'],
                replaceWithChildren: [
                    'form',
                    '.progressiveMedia',
                    '.aspectRatioPlaceholder',
                    '.component-content',
                    '.container',
                    '.article-body-text',
                ],
                replaceDivsWithChildren: [
                    '^col-',
                    'gallery',
                    'para_',
                ],
                insertMissingParagraphTags: ['.entry-content'],
                mergeNodes: ['.article-text', '.section-inner', 'div.page'],
            };

            const preHtml = HtmlProcessor.runHtmlOperations(html, operations);
            resolve(preHtml);
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
                removeElement: ['meta'],
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
    'time',
    'textarea',
    'svg',
    'style',
    'select',
    'select',
    'script',
    'path',
    'noscript',
    'nav',
    'link',
    'input',
    'img.wp-smiley',
    'img.lazy-loaded',
    'img.emoji',
    'iframe',
    'header',
    'footer',
    'canvas',
    'button',
    'aside',
    '#stcpDiv',
    '#sidebar',
    '#footer',
    '#fancybox',
    '#disqus_thread',
    '#content-bottom',
    '.visually-hidden',
    '.sharethis',
    '.post-header',
    '.pinit',
    '.progressiveMedia-thumbnail',
    '.icon',
    '.hidden',
    '.entry-unrelated',
    '.comment',
    '.block-sharethis',
];

module.exports = ContentExtractor;
