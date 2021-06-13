const path = require('path');
const Url = require('url');

const cheerio = require('cheerio');
const stringDirection = require('string-direction');

const TextProcessor = require('./text-processor');
const ContentDownloader = require('./content-downloader');
const Config = require('./config');
const Logger = require('./logger');
const Constants = require('./constants');

const log = new Logger();

const MAX_IMAGE_SIZE = 1000000;
const MAX_TOTAL_IMAGES_SIZE = MAX_IMAGE_SIZE * 6;
const SMALL_IMAGE_SIZE = 4000;
const MAX_IMAGES = 30;

class HtmlProcessor {
    /*
     *   Image extraction
     */

    static _filterDownloadedImages($, imgStatuses) {
        const downloadedImages = [];
        $('img').each((index, elem) => {
            const result = imgStatuses.find((status) => status.src === $(elem).attr('src'));

            const isImageResult = /\.(gif|png|jpg|jpeg|svg)/.test(result && result.path);
            if (result && !result.error && result.path && isImageResult) {
                const bookPath = result.path.replace(/.*(images\/.*)/, '../$1');
                $(elem).attr('src', bookPath);

                // Small images don't need to be huge...
                if (result.contentLength < SMALL_IMAGE_SIZE && $(elem).css('width') === '100%') {
                    $(elem).css('width', '');
                }
                downloadedImages.push(result.path);
            } else {
                $(elem).remove();
            }
        });
        return downloadedImages;
    }

    static extractImages(rootUrl, html) {
        const $ = cheerio.load(html, { decodeEntities: false });
        const sources = HtmlProcessor.getImageSources($);
        const selectedSources = [...new Set(sources)].slice(0, MAX_IMAGES);

        const imgMap = selectedSources.reduce((map, src) => {
            const m = map;
            m[src] = HtmlProcessor.absolutifyUrl(rootUrl, src);
            return m;
        }, {});

        return new Promise((resolve) => {
            HtmlProcessor.downloadImages(imgMap)
                .then((imgStatuses) => {
                    const downloadedImages = HtmlProcessor._filterDownloadedImages($, imgStatuses);
                    resolve({
                        html: $.html(),
                        images: downloadedImages,
                    });
                })
                .catch(log.exception('HtmlProcessor.downloadedImages'));
        });
    }

    static getImageSources($) {
        const imgs = [];
        $('img').each((index, elem) => {
            const src = $(elem).attr('src');
            $(elem).removeAttr('srcset');

            if (src && src.indexOf('data:') === 0) {
                $(elem).remove(); // Remove inline images
            } else if (src) {
                imgs.push(src);
            }
        });
        return imgs;
    }

    static absolutifyUrl(root, url) {
        let absoluteUrl;

        const normalUrl = url.slice(0, 2) === '//' ? `http:${url}` : url;
        const rootParsed = Url.parse(root);
        const parsed = Url.parse(normalUrl);

        if (parsed.host) {
            absoluteUrl = normalUrl;
        } else {
            const dir = rootParsed.path.slice(-1) === '/' ? rootParsed.path : path.dirname(rootParsed.path);
            absoluteUrl = Url.resolve(root, path.resolve(dir, normalUrl));
        }

        return absoluteUrl;
    }

    static downloadImages(imgMap) {
        const downloaders = Object.keys(imgMap).map((imgSrc) => {
            const url = imgMap[imgSrc];
            return new ContentDownloader(url, {
                path: Config.IMAGES_TMP,
                maxSize: MAX_IMAGE_SIZE,
                metadata: { src: imgSrc },
            });
        });

        return ContentDownloader.all(downloaders, {
            maxSize: MAX_TOTAL_IMAGES_SIZE,
        });
    }

    /*
     *   HTML Processing Methods
     */

    static normalizeInput(html) {
        return typeof html === 'string' ? cheerio.load(html, { decodeEntities: false }) : html;
    }

    static normalizeOutput(html, $) {
        return typeof html === 'string' ? $.html() : $;
    }

    static runHtmlOperations(html, operations) {
        let $ = HtmlProcessor.normalizeInput(html);

        Object.keys(operations).forEach((op) => {
            const selectors = operations[op];
            selectors.forEach((selector) => {
                if (HtmlProcessor[op]) {
                    $ = HtmlProcessor[op](selector, $);
                }
            });
        });

        return HtmlProcessor.normalizeOutput(html, $);
    }

    static _processDivsWithRegex(regexps, html, method) {
        const regexArr = Array.isArray(regexps) ? regexps : [regexps];
        const regex = new RegExp(regexArr.join('|'), 'i');

        return HtmlProcessor._proccessElements('div', html, ($elem) => {
            const id = $elem.attr('id') || '';
            const klass = $elem.attr('class') || '';

            if (id.match(regex) || klass.match(regex)) {
                method($elem);
            }
        });
    }

    static _proccessElements(selector, html, method) {
        const $ = HtmlProcessor.normalizeInput(html);

        $(selector).each((index, elem) => method($(elem), index));

        return HtmlProcessor.normalizeOutput(html, $);
    }

    static filterDivs(regexps, html) {
        return HtmlProcessor._processDivsWithRegex(regexps, html, ($elem) => {
            $elem.remove();
        });
    }

    static filterParagraphless(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            if ($elem.find('p').length < 3) {
                $elem.remove();
            }
        });
    }

    static removeElement(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.remove();
        });
    }

    static removeHidden(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            const style = $elem.attr('style');
            if (/display:\s*none/.test(style) || /(\w|^)visibility:\s*hidden/.test(style)) {
                $elem.remove();
            }
        });
    }

    static removeIndent(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            const unindented = TextProcessor.removeIndent($elem.text());
            $elem.text(unindented);
        });
    }

    static replaceDivsWithChildren(regexps, html) {
        return HtmlProcessor._processDivsWithRegex(regexps, html, ($elem) => {
            $elem.replaceWith($elem.children());
        });
    }

    static replaceWithChildren(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.replaceWith($elem.children());
        });
    }

    static replaceWithInnerText(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.html($elem.text());
        });
    }

    static convertToDiv(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.replaceWith(`<div>${$elem.html()}</div>`);
        });
    }

    static maximizeSize(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            const existingWidth = $elem.attr('width') || $elem.css('width');
            if (!existingWidth || !existingWidth.match(/\d+/)) {
                $elem.css('height', 'auto');
                $elem.css('width', '100%');
            } else {
                const isPercentage = existingWidth.indexOf('%') > -1;
                const widthValue = Number(existingWidth.match(/\d+/)[0]);

                if (isPercentage || widthValue > 110) {
                    $elem.attr('width', '');
                    $elem.attr('height', '');
                    $elem.css('height', 'auto');
                    $elem.css('width', '100%');
                }
            }
        });
    }

    static removeInvalidAttributes(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            HtmlProcessor.INVALID_ATTRIBUTES.forEach((attr) => {
                $elem.removeAttr(attr);
            });
        });
    }

    static insertMissingParagraphTags(selector, html) {
        const escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'); // eslint-disable-line

        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            let elemHtml = $elem.html();
            $elem.contents().each((index, elem) => {
                if (elem.type === 'text' && elem.data.trim().length > 7) {
                    const regex = new RegExp(escapeRegExp(elem.data.trim()), 'g');
                    elemHtml = elemHtml.replace(regex, '<p>$&</p>');
                }
            });
            $elem.html(elemHtml);
        });
    }

    static convertToParagraph(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            const contents = $elem.contents();
            const elem = contents[0];
            if (contents.length === 1 && elem.type === 'text' && elem.data.length >= 50) {
                $elem.replaceWith(`<p>${$elem.html()}</p>`);
            }
        });
    }

    static removeDuplicates(selector, html) {
        let $firstElem;
        return HtmlProcessor._proccessElements(selector, html, ($elem, index) => {
            if (index === 0) {
                $firstElem = $elem;
            } else if ($firstElem.html().indexOf($elem.html()) < 0) {
                $elem.remove();
            }
        });
    }

    static mergeNodes(selector, html) {
        let $firstElem;
        return HtmlProcessor._proccessElements(selector, html, ($elem, index) => {
            if (index === 0) {
                $firstElem = $elem;
            } else {
                const clone = $elem.clone();
                $firstElem.append(clone.children());
                $elem.remove();
            }
        });
    }

    static setRootNode(selector, html) {
        const $ = HtmlProcessor.normalizeInput(html);

        const $root = $(selector);
        if ($root.length > 0) {
            $('body').html($root.html());
        }

        return HtmlProcessor.normalizeOutput(html, $);
    }

    static assignDirProperty(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            const direction = stringDirection.getDirection($elem.text());
            if (direction !== 'ltr') {
                $elem.attr('dir', 'rtl');
            }
        });
    }
}

HtmlProcessor.INVALID_ATTRIBUTES = Constants.INVALID_ATTRIBUTES;
HtmlProcessor.FILE_TYPES = Constants.FILE_TYPES;

module.exports = HtmlProcessor;
