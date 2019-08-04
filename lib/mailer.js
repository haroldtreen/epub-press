'use strict';

const nodemailer = require('nodemailer');
const Logger = require('./logger');
const MailGenerator = require('./mail-generator');

const log = new Logger();

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER_HOST,
    port: process.env.MAIL_SERVER_PORT,
    auth: {
        user: process.env.MAIL_SERVER_USERNAME,
        pass: process.env.MAIL_SERVER_PASSWORD,
    },
});

// setup e-mail data with unicode symbols
const defaultMailOptions = {
    from: `"EpubPress" <${process.env.MAIL_SENDER_ADDRESS || 'noreply@epub.press'}>`, // sender address
    to: '',
    subject: 'Your Ebook Is Ready', // Subject line
    html: '<p>The book you made with EpubPress is here!</p>',
};

function getMailOptions(email, book) {
    const mailOptions = Object.assign({}, defaultMailOptions);
    mailOptions.to = email;

    const mailGenerator = new MailGenerator(book);
    mailOptions.html = mailGenerator.generateBody();
    return mailOptions;
}

class Mailer {
    static sendMobi(email, book) {
        const mailOptions = getMailOptions(email, book);
        mailOptions.attachments = [{ filename: 'EpubPress.mobi', path: book.getMobiPath() }];
        return Mailer.sendMail(mailOptions);
    }

    static sendEpub(email, book) {
        const mailOptions = getMailOptions(email, book);
        mailOptions.attachments = [{ filename: 'EpubPress.epub', path: book.getEpubPath() }];
        return Mailer.sendMail(mailOptions);
    }

    static sendMail(options) {
        return new Promise((resolve, reject) => {
            transporter.sendMail(options, (error, info) => {
                if (error) {
                    log.exception('sendMail')(error);
                    reject(error);
                } else {
                    log.info(`Message sent: ${info.response}`);
                    resolve(info);
                }
            });
        });
    }
}

module.exports = Mailer;
