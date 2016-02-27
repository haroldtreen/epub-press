const epubGenerator = require('../lib/epub-generator');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', { title: 'Express' });
});

router.post('/api/books/publish', (req, res) => {
    console.log(req.body['urls[]']);
    if (req.body['urls[]']) {
        epubGenerator.fromUrls(`Book-${Date.now()}`, req.body['urls[]']).then((id) => {
            res.json({ bookId: id });
        });
    } else {
        res.end();
    }
});

router.get('/api/books/download', (req, res) => {
    if (req.query.bookId) {
        res.download(`ebooks/example-ebook${req.query.bookId}.epub`);
    }
});

module.exports = router;
