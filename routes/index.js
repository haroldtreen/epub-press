'use strict';

const BookServices = require('../lib/book-services');
const Book = require('../lib/book');
const Mailer = require('../lib/mailer');

const fs = require('fs');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', { title: 'Epub Press' });
});

router.post('/api/books', (req, res) => {
    console.log(req.body);
    if (req.body.urls) {
        const book = new Book({ urls: req.body.urls });

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
        res.end();
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
