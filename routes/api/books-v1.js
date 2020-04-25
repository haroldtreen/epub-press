'use strict';

const express = require('express');
const Book = require('../../lib/book');
const BookServices = require('../../lib/book-services');
const Mailer = require('../../lib/mailer');
const AppErrors = require('../../lib/app-errors');
const RequestValidators = require('../helpers/request-validators');
const Logger = require('../../lib/logger');

const router = new express.Router();
const log = new Logger();

/*
 * Book Publish
 */

router.post('/', (req, res) => {
    RequestValidators.validatePublishRequest(req)
        .then((validReq) => {
            const book = Book.fromJSON(validReq.body);
            res.status(202).json({ id: book.getId() });
            BookServices.publish(book)
                .then((publishedBook) => {
                    log.verbose('Book Published', { id: publishedBook.getId() });
                })
                .catch(
                    (e) => e
                    // Error handling
                );
        })
        .catch((e) => {
            AppErrors.respondWithError(res, e);
        });
});

/*
 * Book Status
 */

router.get('/:id/status', (req, res) => {
    const book = new Book({ id: req.params.id });
    BookServices.getStatus(book)
        .then((status) => {
            res.status(status.httpStatus || 200).json(status);
        })
        .catch((e) => {
            AppErrors.respondWithError(res, e);
        });
});

/*
 *  Book Download
 */

router.get('/:id/download', (req, res) => {
    Book.find(req.params.id, req.query.filetype)
        .then((book) => {
            const filepath = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();
            res.download(filepath);
        })
        .catch((e) => {
            AppErrors.respondWithError(res, e);
        });
});

router.get('/:id/email', (req, res) => {
    RequestValidators.validateEmailRequest(req)
        .then(() => Book.find(req.params.id, req.query.filetype))
        .then((book) => {
            const isMobi = req.query.filetype === 'mobi';
            const mailerFn = isMobi ? Mailer.sendMobi : Mailer.sendEpub;
            return mailerFn(req.query.email, book).catch((error) => {
                log.warn('Book delivery failed', req.query, error);
                res.status(500).send('Email failed');
            });
        })
        .then(() => {
            res.status(200).send('Email sent!');
        })
        .catch((e) => {
            AppErrors.respondWithError(res, e);
        });
});

module.exports = router;
