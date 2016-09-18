'use strict';

const fs = require('fs');
const express = require('express');
const router = new express.Router();

const AppErrors = require('../../lib/app-errors');

const BookServices = require('../../lib/book-services');
const Mailer = require('../../lib/mailer');
const Book = require('../../lib/book');
const BookModel = require('../../models').Book;

const Logger = require('../../lib/logger');
const log = new Logger();

const StatusTracker = require('../../lib/status-tracker');
const tracker = new StatusTracker();

const MAX_NUM_SECTIONS = 50;

/*
 * Book Status
 */

function trackStep(book, status) {
    log.verbose(status);
    tracker.setStatus(book.getId(), status);
}

function validateStatusRequest(req) {
    return new Promise((resolve, reject) => {
        if (!req.query.id) {
            reject(AppErrors.getApiError('NO_ID_SPECIFIED'));
        } else if (!tracker.getStatus(req.query.id)) {
            reject(AppErrors.getApiError('NOT_FOUND'));
        } else {
            resolve(req);
        }
    });
}

router.get('/status', (req, res) => {
    validateStatusRequest(req).then((validReq) => {
        const status = tracker.getStatus(validReq.query.id);
        res.status(200).json({ data: { status } });
    }).catch((e) => {
        const error = AppErrors.buildApiResponse(e);
        res.status(error.status).json({ errors: [error] });
    });
});


/*
 * Book Publish
 */

function validatePublishRequest(req) {
    return new Promise((resolve, reject) => {
        const sections = req.body.urls || req.body.sections;

        if (!sections) {
            reject(AppErrors.getApiError('NO_SECTIONS_SPECIFIED'));
        } else if (sections.length >= MAX_NUM_SECTIONS) {
            reject(AppErrors.getApiError('TOO_MANY_ITEMS'));
        } else {
            resolve(req);
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
        trackStep(book, 'Downloading HTML');
        BookServices.publish(book).then((publishedBook) => {
            return res.status(201).json({ id: publishedBook.getId() });
        }).catch((e) => {
            log.exception('Book Create')(e);
            const error = AppErrors.buildApiResponse(e);
            res.status(error.status).json({ errors: [error] });
        });
    }).catch((e) => {
        log.exception('Book create')(e);
        const error = AppErrors.buildApiResponse(e);
        res.status(error.status).json({ errors: [error] });
    });
});

/*
 * Book Download
 */

 function findBook(req) {
     return new Promise((resolve, reject) => {
         BookModel.findOne({ where: { uid: req.query.id } }).then((bookModel) => {
             if (!bookModel) {
                 return reject(AppErrors.getApiError('BOOK_NOT_FOUND'));
             }

             const book = new Book({ id: bookModel.uid, title: bookModel.title });
             const path = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();

             fs.stat(path, (err) => {
                 if (err) {
                     reject(AppErrors.getApiError('BOOK_FILE_NOT_FOUND'));
                 } else {
                     resolve(book);
                 }
             });
         });
     });
 }

function validateDownloadRequest(req) {
    return new Promise((resolve, reject) => {
        if (req.query.id) {
            resolve(req);
        } else {
            log.verbose('No ID provided');
            reject(AppErrors.getApiError('NO_ID_SPECIFIED'));
        }
    });
}

router.get('/download', (req, res) => {
    log.verbose('Download', { query: req.query });

    const isEmail = req.query.email;
    const isMobi = req.query.filetype === 'mobi';

    validateDownloadRequest(req).then((validReq) => {
        const { id, filetype } = validReq.params;
        return Book.find(id, filetype).then((book) => {
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
        }).catch((e) => {
            const error = AppErrors.buildApiResponse(e);
            res.status(error.status).json({ errors: [error] });
        });
    }).catch((e) => {
        const error = AppErrors.buildApiResponse(e);
        res.status(error.status).json({ errors: [error] });
    });
});

function validateEmailRequest(req) {
    return new Promise((resolve, reject) => {
        if (req.query.id) {
            if (req.query.email && req.email.trim()) {
                resolve(req);
            } else {
                log.verbose('No email provided');
                reject(new Error('Email must be provided.'));
            }
        } else {
            log.verbose('No id provided');
            reject(new Error('ID must be provided.'));
        }
    });
}

router.get('/email-delivery', (req, res) => {
    log.verbose('Email', { query: req.query });

    const isMobi = req.query.filetype === 'mobi';

    validateEmailRequest(req).then((validReq) => {
        return findBook(validReq).then((book) => {
            const mailerFn = isMobi ? Mailer.sendMobi : Mailer.sendEpub;
            return mailerFn(req.query.email, book).catch((error) => {
                log.warn('Book delivery failed', req.query, error);
                res.status(500).send('Email failed');
            });
        }).then(() => {
            res.status(200).send('Email sent!');
        });
    }).catch((e) => {
        res.status(400).send(e.message);
    });
});

module.exports = router;
