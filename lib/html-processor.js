'use strict';

const cheerio = require('cheerio');
const path = require('path');
const Url = require('url');
const request = require('request').defaults({ gzip: true });
const fs = require('fs-extra');

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

    static extractImages(section) {
        const $ = cheerio.load(section.html);

        const sources = HtmlProcessor.getImageSources($);

        const imgMap = {};
        sources.forEach((src) => {
            const absoluteUrl = HtmlProcessor.absolutifyUrl(section.url, src);
            imgMap[src] = {
                src,
                absoluteUrl,
                localPath: HtmlProcessor.localForRemote(section, absoluteUrl),
            };
        });

        return new Promise((resolve) => {
            HtmlProcessor.downloadImages(imgMap).then((imgStatuses) => {
                $('img').each((index, elem) => {
                    const result = imgStatuses.find((status) => status.src === $(elem).attr('src'));

                    if (result.success && result.localPath) {
                        const bookPath = result.localPath.replace(/.*(images\/.*)/, '../$1');
                        $(elem).attr('src', bookPath);
                    } else {
                        $(elem).remove();
                    }
                });

                resolve($.html());
            }).catch(console.log);
        });
    }

    static getImageSources($) {
        const imgs = [];
        $('img').each((index, elem) => {
            const src = $(elem).attr('src');
            imgs.push(src);
        });
        return imgs;
    }

    static absolutifyUrl(root, url) {
        const rootParsed = Url.parse(root);
        const parsed = Url.parse(url);
        let absoluteUrl;

        if (parsed.host) {
            absoluteUrl = url;
        } else {
            absoluteUrl = Url.resolve(root, path.resolve(rootParsed.path, url));
        }
        return absoluteUrl;
    }

    static localForRemote(section, url) {
        const parsedUrl = Url.parse(url);
        const subfolders = path.dirname(parsedUrl.pathname);
        const file = path.basename(parsedUrl.pathname);
        return path.join(section.imagesPath, subfolders, file);
    }

    static addFiletype(headers, filepath) {
        const FILE_TYPES = {
            'image/png': '.png',
        };

        if (!path.extname(filepath)) {
            const type = headers['content-type'];
            return filepath + FILE_TYPES[type] || '';
        }
        return filepath;
    }

    static downloadImages(imgMap) {
        const requestPromises = Object.keys(imgMap).map((imgSrc) => {
            const downloadInfo = imgMap[imgSrc];

            return new Promise((resolve) => {
                // console.log(downloadInfo);
                const req = request(downloadInfo.absoluteUrl, (error, response, body) => {
                    if (error) {
                        downloadInfo.success = false;
                        downloadInfo.error = error;
                        resolve(downloadInfo);
                    } else {
                        downloadInfo.localPath = HtmlProcessor.addFiletype(
                            response.headers,
                            downloadInfo.localPath
                        );

                        fs.outputFile(downloadInfo.localPath, body, (err) => {
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

    static cleanTags(html) {
        const $ = cheerio.load(html);

        const tagsToFilter = {
            script: 'remove',
            article: 'replaceWith',
            noscript: 'replaceWith',
            p: 'removeAttrs',
            div: 'removeAttrs',
            img: 'maximizeSize',
        };

        const methods = {
            remove: (selector) => {
                $(selector).each((index, elem) => {
                    $(elem).remove();
                });
            },
            replaceWith: (selector) => {
                $(selector).each((index, elem) => {
                    $(elem).replaceWith($(elem).html());
                });
            },
            removeAttrs: (selector) => {
                const invalidAttrs = ['itemprop', 'property'];
                $(selector).each((index, elem) => {
                    invalidAttrs.forEach((attr) => {
                        $(elem).removeAttr(attr);
                    });
                });
            },
            maximizeSize: (selector) => {
                $(selector).each((index, elem) => {
                    $(elem).attr('height', '100%');
                    $(elem).attr('width', '100%');
                });
            },
        };

        Object.keys(tagsToFilter).forEach((key) => {
            const method = tagsToFilter[key];
            methods[method](key);
        });

        return $.html();
    }
}

module.exports = HtmlProcessor;
