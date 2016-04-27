'use strict';

const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EPUB_PRESS_EMAIL,
        pass: process.env.EPUB_PRESS_PASSWORD,
    },
});

// setup e-mail data with unicode symbols
const mailOptions = {
    from: '"Epub Press" <mail@epub.press>', // sender address
    to: '',
    subject: 'Your Ebook Is Ready 📖', // Subject line
    text: 'The book you made with EpubPress is here!', // plaintext body
};

class Mailer {
    static sendMobi(email, book) {
        mailOptions.to = email;
        mailOptions.attachments = [{ filename: 'EpubPress.mobi', path: book.getMobiPath() }];
        return Mailer.sendMail(mailOptions);
    }

    static sendEpub(email, book) {
        mailOptions.to = email;
        mailOptions.attachments = [{ filename: 'EpubPress.epub', path: book.getEpubPath() }];
        return Mailer.sendMail(mailOptions);
    }

    static sendMail(options) {
        return new Promise((resolve, reject) => {
            transporter.sendMail(options, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log(`Message sent: ${info.response}`);
                    resolve(info);
                }
            });
        });
    }
}

module.exports = Mailer;
