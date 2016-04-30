'use strict';

const Config = require('./config');

const fs = require('fs');
const path = require('path');
const marked = require('marked');
const Logger = require('./logger');

const log = new Logger();

class DocumentationLoader {
    constructor(dir) {
        this._path = dir || Config.DOCS_PATH;
    }

    readDocs() {
        return new Promise((resolve) => {
            fs.readdir(this._path, (err, files) => {
                if (err) {
                    log.exception('DocumentationLoader.readDocs')(err);
                }

                const mdFiles = files.filter((file) => path.extname(file) === '.md');

                Promise.all(mdFiles.map((file) =>
                    this.readDoc(file)
                )).then((results) => {
                    resolve(results);
                });
            });
        });
    }

    readDoc(filename) {
        const doc = {};
        return new Promise((resolve) => {
            fs.readFile(path.join(this._path, filename), (err, markdown) => {
                if (err) {
                    log.exception('DocumentationLoader.readDoc')(err);
                }
                const title = filename.match(/([a-z].*).md/i) || [];
                doc.title = title[1];
                doc.id = doc.title.replace(' ', '-').toLowerCase();
                doc.filename = filename;
                doc.markdown = markdown.toString();
                doc.html = marked(markdown.toString());
                resolve(doc);
            });
        });
    }
}

module.exports = DocumentationLoader;
