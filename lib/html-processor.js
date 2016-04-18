'use strict';

const request = require('request').defaults({ gzip: true });
const path = require('path');
const Url = require('url');
const fs = require('fs-extra');

const cheerio = require('cheerio');
const shortid = require('shortid');

const Config = require('./config');

function limitRequestSize(req, cb) {
    let totalData = 0;
    const error = {
        success: false,
        error: 'File too big.',
    };

    req.on('data', (data) => {
        totalData += data.length;
        if (totalData >= 10000000) {
            req.abort();
            cb(error);
        }
    });
}

class HtmlProcessor {

    /*
    *   Image extraction
    */

    static extractImages(rootUrl, html) {
        const $ = cheerio.load(html);
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
                const downloadedImages = [];
                $('img').each((index, elem) => {
                    const result = imgStatuses.find((status) => status.src === $(elem).attr('src'));

                    if (result && result.success && result.localPath) {
                        const bookPath = result.localPath.replace(/.*(images\/.*)/, '../$1');
                        $(elem).attr('src', bookPath);
                        downloadedImages.push(result.localPath);
                    } else {
                        $(elem).remove();
                    }
                });

                resolve({
                    html: $.html(),
                    images: downloadedImages,
                });
            }).catch(console.log);
        });
    }

    static getImageSources($) {
        const imgs = [];
        $('img').each((index, elem) => {
            const src = $(elem).attr('src');
            $(elem).removeAttr('srcset');

            if (src) {
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
            const dir = rootParsed.path.slice(-1) === '/' ?
                rootParsed.path : path.dirname(rootParsed.path);
            absoluteUrl = Url.resolve(root, path.resolve(dir, normalUrl));
        }

        return absoluteUrl;
    }

    static addFiletype(headers, filepath) {
        const FILE_TYPES = {
            'image/png': '.png',
            'image/jpg': '.jpg',
            'image/jpeg': '.jpg',
            'image/gif': '.gif',
            'image/svg+xml': '.svg',
            'image/svg': '.svg',
        };

        if (!path.extname(filepath)) {
            const type = headers['content-type'];
            return filepath + (FILE_TYPES[type] || '');
        }
        return filepath;
    }

    static downloadImages(imgMap) {
        const requestPromises = Object.keys(imgMap).map((imgSrc) => {
            const downloadInfo = imgMap[imgSrc];

            return new Promise((resolve) => {
                const req = request({
                    url: downloadInfo.absoluteUrl,
                    encoding: null,
                }, (error, response, body) => {
                    if (error) {
                        downloadInfo.success = false;
                        downloadInfo.error = error;
                        resolve(downloadInfo);
                    } else {
                        downloadInfo.localPath = HtmlProcessor.addFiletype(
                            response.headers,
                            downloadInfo.localPath
                        );

                        fs.outputFile(downloadInfo.localPath, body, 'binary', (err) => {
                            if (err) {
                                downloadInfo.success = false;
                                downloadInfo.error = err;
                                resolve(downloadInfo);
                            } else {
                                downloadInfo.success = true;
                                resolve(downloadInfo);
                            }
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

    static runHtmlOperations(html, operations) {
        let $ = typeof html === 'string' ? cheerio.load(html) : html;

        Object.keys(operations).forEach((op) => {
            const selectors = operations[op];
            selectors.forEach((selector) => {
                $ = HtmlProcessor[op](selector, $);
            });
        });

        return typeof html === 'string' ? $.html() : $;
    }

    static _processDivsWithRegex(regexps, html, method) {
        const regexArr = Array.isArray(regexps) ? regexps : [regexps];
        const regex = new RegExp(regexArr.join('|'));

        return HtmlProcessor._proccessElements('div', html, ($elem) => {
            const id = $elem.attr('id') || '';
            const klass = $elem.attr('class') || '';

            if (id.match(regex) || klass.match(regex)) {
                method($elem);
            }
        });
    }

    static _proccessElements(selector, html, method) {
        const $ = typeof html === 'string' ? cheerio.load(html) : html;

        $(selector).each((index, elem) =>
            method($(elem))
        );

        return typeof html === 'string' ? $.html() : $;
    }

    static filterDivs(regexps, html) {
        return HtmlProcessor._processDivsWithRegex(regexps, html, ($elem) => {
            $elem.remove();
        });
    }

    static removeElement(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.remove();
        });
    }

    static replaceDivsWithChildren(regexps, html) {
        return HtmlProcessor._processDivsWithRegex(regexps, html, ($elem) => {
            $elem.replaceWith($elem.html());
        });
    }

    static replaceWithChildren(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.replaceWith($elem.html());
        });
    }

    static maximizeSize(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            $elem.attr('height', '');
            $elem.attr('width', '100%');
        });
    }

    static removeInvalidAttributes(selector, html) {
        return HtmlProcessor._proccessElements(selector, html, ($elem) => {
            HtmlProcessor.INVALID_ATTRIBUTES.forEach((attr) => {
                $elem.removeAttr(attr);
            });
        });
    }
}

HtmlProcessor.INVALID_ATTRIBUTES = ['itemprop', 'property', 'srcset', 'style'];

module.exports = HtmlProcessor;
