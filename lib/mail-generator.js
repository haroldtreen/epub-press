'use strict';

const pug = require('pug');

class MailGenerator {
    constructor(book) {
        this.book = book;
    }

    generateBody(versionOverride) {
        const randomVersion = Math.floor(Math.random() * 1000) % MailGenerator.VERSIONS_COUNT;
        const version = typeof versionOverride === 'undefined' ? randomVersion : versionOverride;

        return MailGenerator.renderBody({ book: this.book, version });
    }
}

MailGenerator.VERSIONS_COUNT = 3;
MailGenerator.renderBody = pug.compileFile(`${__dirname}/../views/mail/body.pug`);

module.exports = MailGenerator;
