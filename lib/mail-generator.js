'use strict';

const jade = require('jade');

const Book = require('./book');

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
MailGenerator.renderBody = jade.compileFile(`${__dirname}/../views/mail/body.jade`);

module.exports = MailGenerator;
