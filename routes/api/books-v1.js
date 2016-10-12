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

function respondWithError(res, error) {
    const response = AppErrors.buildApiResponse(error);
    res.status(response.status).json({ errors: [response] });
}

/*
* Book Publish
*/

router.post('/', (req, res) => {
    RequestValidators.validatePublishRequest(req).then((validReq) => {
        const book = Book.fromJSON(validReq.body);
        res.status(202).json({ id: book.getId() });
        BookServices.publish(book).then((publishedBook) => {
            log.verbose('Book Published', { id: publishedBook.getId() });
        }).catch((e) => {
            return e;
            // Error handling
        });
    }).catch((e) => {
        respondWithError(res, e);
    });
});

/*
* Book Status
*/

router.get('/:id/status', (req, res) => {
    const book = new Book({ id: req.params.id });
    BookServices.getStatus(book).then((status) => {
        res.status(200).json(status);
    }).catch((e) => {
        respondWithError(res, e);
    });
});

/*
*  Book Download
*/

router.get('/:id/download', (req, res) => {
    Book.find(req.params.id, req.query.filetype).then((book) => {
        const filepath = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();
        res.download(filepath);
    }).catch((e) => {
        respondWithError(res, e);
    });
});

router.get('/:id/email', (req, res) => {
    const isMobi = req.query.filetype === 'mobi';

    return RequestValidators.validateEmailRequest(req)
    .then(() =>
        Book.find(req.params.id, req.query.filetype)
    )
    .then((book) => {
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
        respondWithError(res, e);
    });
});

module.exports = router;
