'use strict';

const express = require('express');
const DocumentationLoader = require('../lib/documentation-loader');
const metadata = require('../package.json');

const router = express.Router();

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

module.exports = router;
