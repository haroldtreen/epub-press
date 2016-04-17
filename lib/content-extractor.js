'use strict';

const Url = require('url');

const readabilityLibs = require('readability/index');
const JSDOMParser = readabilityLibs.JSDOMParser;
const Readability = readabilityLibs.Readability;

const toReadabilityUri = (href) => {
    const url = Url.parse(href);
    const urlPath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
    return {
        spec: url.href,
        host: url.host,
        prePath: `${url.protocol}//${url.host}`,
        scheme: url.protocol.slice(0, -1),
        pathBase: `${url.protocol}//${url.host}${urlPath}`,
    };
};

const overrideErrorMethod = (parser) => {
    const patchedParser = parser;
    patchedParser.error = (m) => {
        this.errorState += `${m}\n`;
    };
    return patchedParser;
};

class ContentExtractor {
    static parse(href, html) {
        return new Promise((resolve) => {
            let parser = new JSDOMParser();
            parser = overrideErrorMethod(parser);

            const doc = parser.parse(html);

            const readabilityUrl = toReadabilityUri(href);
            let reader = new Readability(readabilityUrl, doc);
            const article = reader.parse();

            parser = null;
            reader = null;

            resolve(article);
        });
    }
}

module.exports = ContentExtractor;
