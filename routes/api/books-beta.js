'use strict';

const express = require('express');
const AppErrors = require('../../lib/app-errors');
const BookServices = require('../../lib/book-services');
const Mailer = require('../../lib/mailer');
const Book = require('../../lib/book');
const Logger = require('../../lib/logger');

const log = new Logger();
const router = new express.Router();

const MAX_NUM_SECTIONS = 50;

function respondWithError(res, error) {
    const validStatus = { 404: true, 400: true, 500: true };
    const errorResp = AppErrors.buildApiResponse(error);
    if (!validStatus[errorResp.status]) {
        errorResp.status = '500';
    }
    res.status(errorResp.status).send(errorResp.detail);
}

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

        log.verbose('Book Metadata', {
            title: body.title,
            description: body.description,
            urls: book.getUrls(),
        });

        resolve(book);
    });
}

router.post('/', (req, res) => {
    validatePublishRequest(req)
        .then((validReq) => bookFromBody(validReq.body))
        .then((book) => {
            BookServices.publish(book)
                .then((publishedBook) => res.status(201).json({ id: publishedBook.getId() }))
                .catch((e) => {
                    log.exception('Book Create')(e);
                    respondWithError(res, e);
                });
        })
        .catch((e) => {
            log.exception('Book create')(e);
            respondWithError(res, e);
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
            reject(AppErrors.getApiError('NO_ID_SPECIFIED'));
        }
    });
}

router.get('/download', (req, res) => {
    log.verbose('Download', { query: req.query });

    const isEmail = req.query.email;
    const isMobi = req.query.filetype === 'mobi';

    validateDownloadRequest(req)
        .then((validReq) => {
            const { id, filetype } = validReq.query;
            return Book.find(id, filetype)
                .then((book) => {
                    if (isEmail) {
                        const mailerFn = isMobi ? Mailer.sendMobi : Mailer.sendEpub;
                        return mailerFn(req.query.email, book).catch((error) => {
                            log.warn('Book delivery failed', req.query, error);
                            res.status(500).send('Email failed');
                        });
                    }
                    const bookPath = isMobi ? book.getMobiPath() : book.getEpubPath();
                    return Promise.resolve(bookPath);
                })
                .then((bookPath) => {
                    if (isEmail) {
                        res.status(200).send('Email sent!');
                    } else {
                        res.download(bookPath);
                    }
                })
                .catch((e) => {
                    respondWithError(res, e);
                });
        })
        .catch((e) => {
            respondWithError(res, e);
        });
});

function validateEmailRequest(req) {
    return new Promise((resolve, reject) => {
        if (req.query.id) {
            if (req.query.email && req.query.email.trim()) {
                resolve(req);
            } else {
                log.verbose('No email provided');
                reject(AppErrors.getApiError('NO_EMAIL_SPECIFIED'));
            }
        } else {
            log.verbose('No id provided');
            reject(AppErrors.getApiError('NO_ID_SPECIFIED'));
        }
    });
}

router.get('/email-delivery', (req, res) => {
    log.verbose('Email', { query: req.query });

    const isMobi = req.query.filetype === 'mobi';

    validateEmailRequest(req)
        .then(() =>
            Book.find(req.query.id, req.query.filetype)
                .then((book) => {
                    const mailerFn = isMobi ? Mailer.sendMobi : Mailer.sendEpub;
                    return mailerFn(req.query.email, book).catch((error) => {
                        log.warn('Book delivery failed', req.query, error);
                        res.status(500).send('Email failed');
                    });
                })
                .then(() => {
                    res.status(200).send('Email sent!');
                }))
        .catch((e) => {
            respondWithError(res, e);
        });
});

module.exports = router;
