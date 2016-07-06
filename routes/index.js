'use strict';

const BookServices = require('../lib/book-services');
const Mailer = require('../lib/mailer');
const Book = require('../lib/book');
const DocumentationLoader = require('../lib/documentation-loader');
const metadata = require('../package.json');

const express = require('express');
const router = express.Router();

const Logger = require('../lib/logger');

const log = new Logger();

const MAX_NUM_SECTIONS = 50;

/* GET home page. */
router.get('/', (req, res) => {
    const docsLoader = new DocumentationLoader();

    docsLoader.readDocs().then((docs) => {
        res.render('index', { metadata, docs });
    });
});

router.get('/support-success', (req, res) => {
    res.render('support-success', { metadata });
});

router.get('/api/version', (req, resp) => {
    resp.json({
        version: require('../package.json').version,
        minCompatible: '0.8.0',
        message: 'An update for EpubPress is available.',
    });
});

function validateRequest(req) {
    const sections = req.body.urls || req.body.sections;
    const isValid = !!sections && sections.length < MAX_NUM_SECTIONS;

    return isValid;
}

function bookFromBody(body) {
    let book;
    if (body.urls || body.sections) {
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
        book = new Book({ title: body.title, description: body.description }, sections);
        log.verbose('Book Metadata',
            { title: body.title, description: body.description, urls: book.getUrls() });
    } else {
        book = null;
    }
    return book;
}

router.post('/api/books', (req, res) => {
    const isValid = validateRequest(req);
    if (isValid) {
        const book = bookFromBody(req.body);
        if (book) {
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
                log.verbose('Responding');
                writtenBook.commit();
                res.json({ id: writtenBook.getMetadata().id });
            }).catch((e) => {
                log.exception('Book Create')(e);
                res.status(500).send('Unknown error');
            });
        } else {
            log.warn('Body with no book', { body: req.body });
            res.status(400).send('No sections provided.');
        }
    } else {
        log.warn('Invalid request attempted');
        res.status(400).send(`Max of ${MAX_NUM_SECTIONS} items exceeded.`);
    }
});

router.get('/api/books/download', (req, res) => {
    log.verbose('Download', { query: req.query });
    if (req.query.id) {
        const book = new Book({ id: req.query.id });

        if (req.query.email) {
            const mailerMethod = req.query.filetype === 'mobi' ? Mailer.sendMobi : Mailer.sendEpub;

            mailerMethod(req.query.email, book).then(() => {
                res.status(200).send('Email Sent');
            }).catch((error) => {
                log.exception('Mailer Download')(error);
                res.status(500).send('Email could not be sent');
            });
        } else {
            const path = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();
            res.download(path);
        }
    } else {
        log.verbose('No ID provided');
        res.status(400).send('ID Must be provided');
    }
});

module.exports = router;
