const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const request = require('request').defaults({ gzip: true });
const shortid = require('shortid');

const Constants = require('./constants');

const DEFAULT_OPTIONS = {
    maxSize: 1000000, // 1 Mb
    metadata: {},
};

/**
 * @typedef ContentDownloaderOptions
 * @type {object}
 * @property {number} maxSize - maximum download size in bytes (default 1MB)
 * @property {string} path - download destination folder
 * @property {object} metadata - not used in download process.
 *  this object will be destructured and included in the response
 */

class ContentDownloader {
    static adjustMaxSizes(downloaders, maxSize) {
        const incomplete = downloaders.filter((d) => !d.isComplete());
        const incompleteSize = incomplete.reduce((t, d) => t + d.getSize(), 0);
        incomplete.forEach((d) => {
            const extra = Math.max(0, maxSize - incompleteSize);
            d.setMaxSize(extra + d.getSize());
        });
    }

    static all(downloaders, opts = {}) {
        let maxSize = opts.maxSize || DEFAULT_OPTIONS.maxSize * downloaders.length;
        ContentDownloader.adjustMaxSizes(downloaders, maxSize);

        return Promise.map(
            downloaders,
            (downloader) =>
                downloader
                    .download()
                    .then((result) => {
                        maxSize -= result.contentLength;
                        ContentDownloader.adjustMaxSizes(downloaders, maxSize);
                        return Promise.resolve(result);
                    })
                    .catch((error) => Promise.resolve({ error })),
            { concurrency: 1 }
        );
    }

    static isValidResponse(response) {
        if (response.statusCode < 300 && response.statusCode >= 200) {
            return true;
        }
        return false;
    }

    /**
     *
     * @param {string} url
     * @param {ContentDownloaderOptions} opts
     */
    constructor(url, opts = {}) {
        this.url = url;
        this.status = { isComplete: false, size: 0 };
        this.opts = { ...DEFAULT_OPTIONS, ...opts };
    }

    isComplete() {
        return this.status.isComplete;
    }

    setMaxSize(maxSize) {
        this.opts.maxSize = maxSize;
    }

    getSize() {
        return this.status.size;
    }

    getPath() {
        return this.opts.path;
    }

    getUrl() {
        return this.url;
    }

    getFiletype(contentType) {
        let filetype = '';
        const lookupType = ContentDownloader.FILE_TYPES[contentType];
        const urlType = this.getUrl() && path.extname(this.getUrl());
        if (lookupType) {
            filetype = lookupType;
        } else if (/\.jpg|\.gif|\.jpeg|\.png/i.test(urlType)) {
            filetype = urlType;
        }
        return filetype;
    }

    getFilename(contentType) {
        return `${shortid.generate()}${this.getFiletype(contentType)}`;
    }

    limitRequestSize(req) {
        req.on('data', (data) => {
            this.status.size += data.length;
            if (this.getSize() >= this.opts.maxSize) {
                req.abort();
            }
        });
    }

    saveResult(result) {
        const savedResult = { ...result };
        return new Promise((resolve, reject) => {
            if (this.getPath()) {
                const filename = this.getFilename(result.contentType);
                const outputPath = path.join(this.getPath(), filename);

                fs.outputFile(outputPath, result.content, 'binary', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        savedResult.content = undefined;
                        savedResult.path = outputPath;
                        resolve(savedResult);
                    }
                });
            } else {
                resolve(savedResult);
            }
        });
    }

    getResult(response, body) {
        return new Promise((resolve, reject) => {
            const result = {
                ...this.opts.metadata,
                statusCode: response.statusCode,
                content: body,
                contentLength: this.getSize(),
                contentType: response.headers['content-type'],
            };
            if (!ContentDownloader.isValidResponse(response)) {
                resolve(result);
            } else {
                this.saveResult(result)
                    .then((savedResult) => {
                        resolve(savedResult);
                    })
                    .catch(reject);
            }
        });
    }

    onRequestComplete(resolve, reject) {
        const self = this;
        return (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                self.getResult(response, body)
                    .then((result) => {
                        resolve(result);
                    })
                    .catch(reject);
            }
        };
    }

    download() {
        return new Promise((resolve, reject) => {
            if (!this.getUrl()) {
                reject(new Error('Url missing.'));
            } else {
                const onComplete = this.onRequestComplete(resolve, reject);
                const req = request.get(
                    {
                        url: this.getUrl(),
                        encoding: null,
                        headers: {
                            // I'm a browser 😁
                            'User-Agent':
                                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                        },
                    },
                    onComplete
                );

                req.on('abort', () => {
                    reject(new Error('Download aborted.'));
                });

                this.limitRequestSize(req);
            }
        });
    }
}

ContentDownloader.FILE_TYPES = Constants.FILE_TYPES;

module.exports = ContentDownloader;
