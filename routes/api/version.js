'use strict';

const express = require('express');
const router = express.Router();
const packageJSON = require('../../package.json');

router.get('/', (req, res) => {
    res.json({
        version: packageJSON.version,
        minCompatible: '0.8.0',
        message: 'An update for EpubPress is available.',
    });
});

module.exports = router;
