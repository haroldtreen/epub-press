const readability = require('node-readability');
const HtmlProcessor = require('./html-processor');
const Logger = require('./logger');

const log = new Logger();

class ContentExtractor {
    static extract(html) {
        return new Promise((resolve) => {
            ContentExtractor.preprocess(html)
                .then(preHtml => ContentExtractor.process(preHtml))
                .then((article) => {
                    const { title, content } = article;
                    article.close();
                    ContentExtractor.postprocess(content || '')
                        .then((postHtml) => {
                            const extracted = { title, content: postHtml };
                            resolve(extracted);
                        })
                        .catch(log.exception('ContentExtractor.extract'));
                })
                .catch(log.exception('ContentExtractor.extract'));
        });
    }

    static preprocess(html) {
        return new Promise((resolve) => {
            const operations = ContentExtractor.preprocess.OPERATIONS;

            const preHtml = HtmlProcessor.runHtmlOperations(html, operations);
            resolve(preHtml);
        });
    }

    static process(html) {
        return new Promise((resolve) => {
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
            const operations = ContentExtractor.postprocess.OPERATIONS;

            const postHtml = HtmlProcessor.runHtmlOperations(html, operations);
            resolve(postHtml);
        });
    }

    static findOperationsForUrl(url) {
        let operations;
        Object.keys(ContentExtractor.URL_SPECIFIC_OPERATIONS).forEach((pattern) => {
            const regex = new RegExp(pattern);
            if (regex.test(url)) {
                operations = ContentExtractor.URL_SPECIFIC_OPERATIONS[pattern];
            }
        });
        return operations;
    }

    static runUrlSpecificOperations(html, url) {
        return new Promise((resolve) => {
            let processedHtml = html;
            const operations = this.findOperationsForUrl(url);
            if (operations) {
                processedHtml = HtmlProcessor.runHtmlOperations(html, operations);
            }
            resolve(processedHtml);
        });
    }
}

ContentExtractor.URL_SPECIFIC_OPERATIONS = {
    'www.quora.com': {
        setRootNode: ['.AnswerPagedList'],
        mergeNodes: ['.AnswerBase'],
        removeElement: ['.hidden', '.CredibilityFacts', '.ActionBar', '.AnswerFooter', '.Button'],
        insertMissingParagraphTags: ['.info_wrapper', '.inline_editor_content', '.rendered_qtext'],
        replaceWithChildren: ['.AnswerHeader', '.inline_editor_value', '.rendered_qtext'],
        replaceDivsWithChildren: ['\\w{6}', 'wrapper', 'header', 'info', '\\w{0}'],
        replaceWithInnerText: ['.feed_item_answer_user'],
    },
};

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
    'footer',
    'canvas',
    'button',
    'aside',
    'a.w3-btn',
    '#carousel',
    '#stcpDiv',
    '#sidebar',
    '#footer',
    '#fancybox',
    '#disqus_thread',
    '#content-bottom',
    '#veil',
    '.visually-hidden',
    '.sharethis',
    '.post-header',
    '.pinit',
    '.progressiveMedia-thumbnail',
    '.icon',
    '.entry-unrelated',
    '.comment',
    '.block-sharethis',
];

ContentExtractor.preprocess.OPERATIONS = {
    removeElement: [ContentExtractor.preprocess.REMOVE_ELEMENTS.join(',')],
    filterDivs: [
        'popup',
        'signup',
        'addthis',
        'sharethis',
        '^tool',
        'player',
        '^sub($|[^pr])',
        'sticky-header',
        'excerpt',
    ],
    convertToParagraph: ['span'],
    filterParagraphless: ['article'],
    removeHidden: ['span,div,aside,li'],
    removeDuplicates: ['article'],
    replaceWithChildren: [
        'form',
        '.progressiveMedia',
        '.aspectRatioPlaceholder',
        '.component-content',
        'div.container',
        '.article-body-text',
        '.module',
    ],
    replaceDivsWithChildren: [
        '^col-',
        'gallery',
        'para_',
        'frame-',
        'outline',
        '-example',
        '-code',
        'wrapper',
        '-block',
        '-segment',
    ],
    insertMissingParagraphTags: [
        '.entry-content',
        '.chapter-content',
        '.post-content',
        '.content',
        '.txt',
        '.holder',
    ],
    mergeNodes: ['.article-text', '.section-inner', 'div.page', 'div.gtxt_body'],
};

ContentExtractor.postprocess.OPERATIONS = {
    maximizeSize: ['img'],
    removeElement: ['meta'],
    removeInvalidAttributes: ['h1,h2,h3,h4,h5,h6,body,div,p,a,span,img'],
    replaceWithChildren: ['article', 'main', 'figure', 'figcaption'],
    convertToDiv: ['section', 'center', 'aside'],
    replaceWithInnerText: ['code'],
    assignDirProperty: ['p'],
};

module.exports = ContentExtractor;
