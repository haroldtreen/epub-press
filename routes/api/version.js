'use strict';

const express = require('express');

const router = express.Router();
const packageJSON = require('../../package.json');

router.get('/', (req, res) => {
    res.json({
        version: packageJSON.version,
        minCompatible: '0.8.0',
        clients: {
            'epub-press-chrome': {
                minCompatible: '0.9.0',
                message: 'An update is available.',
            },
            'epub-press-js': {
                minCompatible: '0.3.1',
                message: 'An update for epub-press-js is available.',
            },
        },
        message: 'An update for EpubPress is available.',
    });
});

module.exports = router;
