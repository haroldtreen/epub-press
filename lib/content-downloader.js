const fs = require('fs-extra');
const path = require('path');
const request = require('request').defaults({ gzip: true });
const shortid = require('shortid');

const DEFAULT_OPTIONS = {
    maxSize: 1000000,
};

class ContentDownloader {
    static all(downloaders) {
        const downloadPromises = downloaders.map(downloader =>
            downloader.download().catch(error => Promise.resolve({ error }))
        );
        return Promise.all(downloadPromises);
    }

    static isValidResponse(response) {
        if (response.statusCode < 300 && response.statusCode >= 200) {
            return true;
        }
        return false;
    }

    constructor(url, opts) {
        this.url = url;
        this.opts = Object.assign({}, DEFAULT_OPTIONS, opts);
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
        const maxSize = this.opts.maxSize;
        let totalData = 0;

        req.on('data', (data) => {
            totalData += data.length;
            if (totalData >= maxSize) {
                req.abort();
            }
        });
    }

    saveResult(result) {
        const savedResult = Object.assign({}, result);
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
                statusCode: response.statusCode,
                content: body,
                contentLength: response.headers['content-length'],
                contentType: response.headers['content-type'],
            };

            if (!ContentDownloader.isValidResponse(response)) {
                resolve(result);
            } else {
                result.success = true;
                this.saveResult(result).then((savedResult) => {
                    resolve(savedResult);
                }).catch(reject);
            }
        });
    }

    onRequestComplete(resolve, reject) {
        const self = this;
        return (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                self.getResult(response, body).then((result) => {
                    resolve(result);
                }).catch(reject);
            }
        };
    }

    download() {
        return new Promise((resolve, reject) => {
            if (!this.getUrl()) {
                reject(new Error('Url missing.'));
            } else {
                const onComplete = this.onRequestComplete(resolve, reject);
                const req = request.get(this.getUrl(), onComplete);

                req.on('abort', () => {
                    reject(new Error('Download aborted.'));
                });

                this.limitRequestSize(req);
            }
        });
    }
}

ContentDownloader.FILE_TYPES = {
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

module.exports = ContentDownloader;
