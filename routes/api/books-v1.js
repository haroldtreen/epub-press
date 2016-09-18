'use strict';

const express = require('express');
const router = new express.Router();

const Book = require('../../lib/book');
const BookServices = require('../../lib/book-services');
const AppErrors = require('../../lib/app-errors');

const RequestValidators = require('../helpers/request-validators');

function respondWithError(res, error) {
    const response = AppErrors.buildApiResponse(error);
    res.status(response.status).json({ errors: [response] });
}

router.post('/', (req, res) => {
    RequestValidators.validatePublishRequest(req).then((validReq) => {
        const book = Book.fromJSON(validReq.body);
        res.status(202).json({ id: book.getId() });
        BookServices.publish(book).then((publishedBook) => {

        }).catch((e) => {
            
        });
    }).catch((e) => {
        respondWithError(res, e);
    });
});

module.exports = router;
