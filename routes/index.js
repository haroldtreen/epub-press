'use strict';

const BookServices = require('../lib/book-services');
const Book = require('../lib/book');
const fs = require('fs');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', { title: 'Express' });
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
            console.log('Converting Contents');
            const filteredBook = BookServices.filterSectionsContent(updatedBook);
            return BookServices.convertSectionsContent(filteredBook);
        }).then((updatedBook) => {
            console.log('Writting Ebook');
            return updatedBook.writeEpub();
        }).then((writtenBook) => {
            console.log('Creating .mobi');
            return BookServices.convertToMobi(writtenBook)
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
        const path = req.query.filetype === 'mobi' ? book.getMobiPath() : book.getEpubPath();
        res.download(path);
    } else {
        res.status(400).send('ID Must be provided');
    }
});

module.exports = router;
