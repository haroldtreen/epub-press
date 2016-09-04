'use strict';

const BookServices = require('../../lib/book-services');
const Mailer = require('../../lib/mailer');
const Book = require('../../lib/book');
const BookModel = require('../../models/').Book;

const fs = require('fs');
const express = require('express');
const router = express.Router();

const Logger = require('../../lib/logger');
const log = new Logger();

const MAX_NUM_SECTIONS = 50;

/*
 * Book Publish
 */

function validatePublishRequest(req) {
    return new Promise((resolve, reject) => {
        const sections = req.body.urls || req.body.sections;
        const isValid = !!sections && sections.length <= MAX_NUM_SECTIONS;

        if (isValid) {
            resolve(req);
        } else {
            log.warn('Invalid request attempted');
            reject(new Error(`Max of ${MAX_NUM_SECTIONS} items exceeded.`));
        }
    });
}

function bookFromBody(body) {
    return new Promise((resolve) => {
        const sections = [];
        if (body.urls) {
            log.verbose('Urls request');
            body.urls.forEach((url) => {
                sections.push({
                    url,
                    html: null,
                });
            });
        } else if (body.sections) {
            log.verbose('Sections request');
            body.sections.forEach((section) => {
                sections.push({
                    url: section.url,
                    html: section.html,
                });
            });
        }

        const book = new Book({ title: body.title, description: body.description }, sections);

        log.verbose('Book Metadata',
        { title: body.title, description: body.description, urls: book.getUrls() });

        resolve(book);
    });
}

router.post('/', (req, res) => {
    validatePublishRequest(req).then((validReq) =>
        bookFromBody(validReq.body)
    ).then((book) => {
        log.verbose('Downloading HTML');
        BookServices.updateSectionsHtml(book).then((updatedBook) => {
            log.verbose('Extracting Content');
            return BookServices.extractSectionsContent(updatedBook);
        }).then((updatedBook) => {
            log.verbose('Downloading Images');
            return BookServices.localizeSectionsImages(updatedBook);
        }).then((updatedBook) => {
            log.verbose('Converting contents');
            return BookServices.convertSectionsContent(updatedBook);
        }).then((updatedBook) => {
            log.verbose('Writting Ebook');
            return updatedBook.writeEpub();
        }).then((writtenBook) => {
            log.verbose('Creating .mobi');
            return BookServices.convertToMobi(writtenBook);
        }).then((writtenBook) => {
            return writtenBook.commit();
        }).then((writtenBook) => {
            res.json({ id: writtenBook.getMetadata().id });
        })
        .catch((e) => {
            log.exception('Book Create')(e);
            res.status(500).send('Unknown error');
        });
    }).catch((e) => {
        res.status(400).send(e.message);
    });
});

/*
 * Book Download
 */

function validateDownloadRequest(req) {
    return new Promise((resolve, reject) => {
        if (req.query.id) {
            resolve(req);
        } else {
            log.verbose('No ID provided');
            reject(new Error('ID must be provided'));
        }
    });
}

function findBook(req) {
    return new Promise((resolve, reject) => {
        BookModel.findOne({ where: { uid: req.query.id } }).then((bookModel) => {
            if (!bookModel) {
                return reject(new Error('Not found in DB'));
            }

            const book = new Book({ id: bookModel.uid, title: bookModel.title });
            const path = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();

            fs.stat(path, (err) => {
                if (err) {
                    reject(new Error('File not found.'));
                } else {
                    resolve(book);
                }
            });
        });
    });
}

router.get('/download', (req, res) => {
    log.verbose('Download', { query: req.query });

    const isEmail = req.query.email;
    const isMobi = req.query.filetype === 'mobi';

    validateDownloadRequest(req).then((validReq) => {
        return findBook(validReq).then((book) => {
            if (isEmail) {
                const mailerFn = isMobi ? Mailer.sendMobi : Mailer.sendEpub;
                return mailerFn(req.query.email, book).catch((error) => {
                    log.warn('Book delivery failed', req.query, error);
                    res.status(500).send('Email failed');
                });
            }
            const bookPath = isMobi ? book.getMobiPath() : book.getEpubPath();
            return Promise.resolve(bookPath);
        }).then((bookPath) => {
            if (isEmail) {
                res.status(200).send('Email sent!');
            } else {
                res.download(bookPath);
            }
        }).catch((error) => {
            log.warn('No book with id', req.query, error);
            res.status(404).send(`Book with id ${req.query.id} not found.`);
        });
    }).catch((e) => {
        res.status(400).send(e.message);
    });
});

module.exports = router;
