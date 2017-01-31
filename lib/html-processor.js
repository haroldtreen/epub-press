'use strict';

const request = require('request').defaults({ gzip: true });
const path = require('path');
const Url = require('url');
const fs = require('fs-extra');

const cheerio = require('cheerio');
const shortid = require('shortid');

const TextProcessor = require('./text-processor');
const Config = require('./config');
const Logger = require('./logger');

const log = new Logger();

const MAX_IMAGE_SIZE = 1000000;
const SMALL_IMAGE_SIZE = 4000;
const MAX_IMAGES = 10;

function limitRequestSize(req, cb) {
    let totalData = 0;
    const error = {
        success: false,
        error: 'File too big.',
    };

    req.on('data', (data) => {
        totalData += data.length;
        if (totalData >= MAX_IMAGE_SIZE) {
            log.error('Large request aborted');
            req.abort();
            cb(error);
        }
    });
}

class HtmlProcessor {

    /*
    *   Image extraction
    */

    static _filterDownloadedImages($, imgStatuses) {
        const downloadedImages = [];
        $('img').each((index, elem) => {
            const result = imgStatuses.find((status) => status.src === $(elem).attr('src'));

            if (result && result.success && result.localPath) {
                const bookPath = result.localPath.replace(/.*(images\/.*)/, '../$1');
                $(elem).attr('src', bookPath);

                // Small images don't need to be huge...
                if (result.contentLength < SMALL_IMAGE_SIZE && $(elem).css('width') === '100%') {
                    $(elem).css('width', '');
                }
                downloadedImages.push(result.localPath);
            } else {
                $(elem).remove();
            }
        });
        return downloadedImages;
    }

    static extractImages(rootUrl, html) {
        const $ = cheerio.load(html, { decodeEntities: false });
        const sources = HtmlProcessor.getImageSources($);

        const imgMap = {};
        sources.forEach((src) => {
            const absoluteUrl = HtmlProcessor.absolutifyUrl(rootUrl, src);
            imgMap[src] = {
                src,
                absoluteUrl,
                localPath: `${Config.IMAGES_TMP}/${shortid.generate()}`,
            };
        });

        return new Promise((resolve) => {
            HtmlProcessor.downloadImages(imgMap).then((imgStatuses) => {
                const downloadedImages = HtmlProcessor._filterDownloadedImages($, imgStatuses);

                resolve({
                    html: $.html(),
                    images: downloadedImages,
                });
            }).catch(log.exception('HtmlProcessor.downloadedImages'));
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
                if (imgs.length < MAX_IMAGES) {
                    imgs.push(src);
                }
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
            const dir = rootParsed.path.slice(-1) === '/' ?
                rootParsed.path : path.dirname(rootParsed.path);
            absoluteUrl = Url.resolve(root, path.resolve(dir, normalUrl));
        }

        return absoluteUrl;
    }

    static setFiletype(downloadInfo) {
        let newPath = downloadInfo.localPath;
        if (!path.extname(newPath)) {
            newPath += HtmlProcessor.getFiletype(downloadInfo);
        }
        return newPath;
    }

    static getFiletype(downloadInfo) {
        let filetype;
        const lookupType = HtmlProcessor.FILE_TYPES[downloadInfo.contentType];
        const srcType = downloadInfo.src && path.extname(downloadInfo.src);
        if (lookupType) {
            filetype = lookupType;
        } else if (/\.jpg|\.gif|\.jpeg|\.png/i.test(srcType)) {
            filetype = srcType;
        } else {
            filetype = '';
        }
        return filetype;
    }

    static _setError(downloadInfo, msg) {
        const info = downloadInfo;
        log.warn(msg, downloadInfo);
        info.success = false;
        info.error = msg;
        return info;
    }

    static _handleDownloadSuccess(downloadInfo, body) {
        const info = downloadInfo;

        return new Promise((resolve) => {
            fs.outputFile(downloadInfo.localPath, body, 'binary', (err) => {
                if (err) {
                    log.exception('fs.outputfile')(err);
                    info.success = false;
                    info.error = err;
                } else {
                    info.success = true;
                }
                resolve(info);
            });
        });
    }

    static downloadImages(imgMap) {
        const requestPromises = Object.keys(imgMap).map((imgSrc) => {
            let downloadInfo = imgMap[imgSrc];

            return new Promise((resolve) => {
                const req = request({
                    url: downloadInfo.absoluteUrl,
                    encoding: null,
                }, (error, response, body) => {
                    if (response && response.headers) {
                        downloadInfo.contentType = response.headers['content-type'];
                        downloadInfo.contentLength = response.headers['content-length'];
                    }

                    if (error) {
                        downloadInfo = HtmlProcessor._setError(
                            downloadInfo,
                            `Image downloaded error: ${error}`
                        );
                        resolve(downloadInfo);
                    } else if (response.statusCode > 200) {
                        downloadInfo = HtmlProcessor._setError(
                            downloadInfo,
                            `Image download status code: ${response.statusCode}`
                        );
                        resolve(downloadInfo);
                    } else if (!HtmlProcessor.getFiletype(downloadInfo)) {
                        downloadInfo = HtmlProcessor._setError(
                            downloadInfo,
                            `Image content type error: ${downloadInfo.contentType}`
                        );
                        resolve(downloadInfo);
                    } else {
                        downloadInfo.localPath = HtmlProcessor.setFiletype(downloadInfo);
                        HtmlProcessor._handleDownloadSuccess(downloadInfo, body).then((info) => {
                            resolve(info);
                        });
                    }
                });
                limitRequestSize(req, resolve);
            });
        });

        return Promise.all(requestPromises);
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

        $(selector).each((index, elem) =>
            method($(elem), index)
        );

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
        const escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

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
}

HtmlProcessor.INVALID_ATTRIBUTES = [
    'srcset',
    'sizes',
    'rel:buzz_num',
    'epub:type',
    'property',
    'onclick',
    'itemtype',
    'itemscope',
    'itemprop',
    'draggable',
    'data-web-url',
    'data-type',
    'data-tracker-label',
    'data-tracker-category',
    'data-tracker-action',
    'data-tout-type',
    'data-total-count',
    'data-test-id',
    'data-reactid',
    'data-pin-desc',
    'data-pin-credits',
    'data-para-count',
    'data-original',
    'data-node-uid',
    'data-link-name',
    'data-href',
    'data-full-size',
    'data-component',
    'data-chorus-asset-id',
    'aria-label',
];
HtmlProcessor.FILE_TYPES = {
    'image/png': '.png',
    'image/x-png': '.png',
    'image/png;charset=UTF-8': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpg',
    'image/JPEG': '.jpg',
    'image/jpeg;charset=UTF-8': '.jpg',
    'image/svg+xml': '.svg',
    'image/svg': '.svg',
    'image/gif': '.gif',
};

module.exports = HtmlProcessor;
