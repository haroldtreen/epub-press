const BookServices = require('../lib/book-services');
const Book = require('../lib/book');
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
            return BookServices.convertSectionsContent(updatedBook);
        }).then((updatedBook) => {
            console.log('Writting Ebook');
            return updatedBook.writeEpub();
        }).then((writtenBook) => {
            console.log('Responding');
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ id: writtenBook.getFilename() }, null, 3));
        }).catch(console.log);
    } else {
        res.end();
    }
});

router.get('/api/books/download', (req, res) => {
    if (req.query.id) {
        res.download(`ebooks/${req.query.id}.epub`);
    }
});

module.exports = router;
