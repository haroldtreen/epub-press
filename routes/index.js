'use strict';

const BookServices = require('../lib/book-services');
const Mailer = require('../lib/mailer');
const Book = require('../lib/book');
const DocumentationLoader = require('../lib/documentation-loader');

const newrelic = require('newrelic');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    const docsLoader = new DocumentationLoader();

    docsLoader.readDocs().then((docs) => {
        res.render('index', { title: 'EpubPress (Beta)', docs });
    });
});

router.get('/api/version', (req, resp) => {
    resp.json({
        version: require('../package.json').version,
        minCompatible: '0.6.0',
        message: 'An update for EpubPress is available.',
    });
});

function bookFromBody(body) {
    let book;
    if (body.urls || body.sections) {
        const sections = [];
        if (body.urls) {
            body.urls.forEach((url) => {
                sections.push({
                    url,
                    html: null,
                });
            });
        } else if (body.sections) {
            body.sections.forEach((section) => {
                sections.push({
                    url: section.url,
                    html: section.html,
                });
            });
        }
        book = new Book({}, sections);
        console.log(book.getUrls());
    } else {
        book = null;
    }
    return book;
}

router.post('/api/books', (req, res) => {
    const book = bookFromBody(req.body);
    if (book) {
        console.log('Downloading HTML');
        BookServices.updateSectionsHtml(book).then((updatedBook) => {
            console.log('Extracting Content');
            return BookServices.extractSectionsContent(updatedBook);
        }).then((updatedBook) => {
            console.log('Downloading Images');
            const filteredBook = BookServices.filterSectionsContent(updatedBook);
            return BookServices.localizeSectionsImages(filteredBook);
        }).then((updatedBook) => {
            console.log('Converting contents');
            return BookServices.convertSectionsContent(updatedBook);
        }).then((updatedBook) => {
            console.log('Writting Ebook');
            return updatedBook.writeEpub();
        }).then((writtenBook) => {
            console.log('Creating .mobi');
            return BookServices.convertToMobi(writtenBook);
        }).then((writtenBook) => {
            console.log('Responding');
            res.json({ id: writtenBook.getMetadata().id });
        }).catch(console.log);
    } else {
        res.status(400).send('No sections provided.');
    }
});

router.get('/api/books/download', (req, res) => {
    console.log(req.query);
    if (req.query.id) {
        const book = new Book({ id: req.query.id });

        if (req.query.email) {
            const mailerMethod = req.query.filetype === 'mobi' ? Mailer.sendMobi : Mailer.sendEpub;

            mailerMethod(req.query.email, book).then(() => {
                res.status(200).send('Email Sent');
            }).catch((error) => {
                console.log('Mail error:');
                console.log(error);
                res.status(500).send('Email could not be sent');
            });
        } else {
            const path = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();
            res.download(path);
        }
    } else {
        res.status(400).send('ID Must be provided');
    }
});

module.exports = router;
