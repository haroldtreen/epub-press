const BookServices = require('../lib/book-services');
const Book = require('../lib/book');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', { title: 'Express' });
});

router.post('/api/books', (req, res) => {
    console.log(req.body.urls);
    if (req.body.urls) {
        const book = new Book({ urls: req.body.urls });

        BookServices.updateSectionsHtml(book).then((updatedBook) =>
            BookServices.extractSectionsContent(updatedBook)
        ).then((updatedBook) =>
            BookServices.convertSectionsContent(updatedBook)
        ).then((updatedBook) =>
            updatedBook.writeEpub()
        ).then((writtenBook) =>
            res.json({ id: writtenBook.filename() })
        );
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
