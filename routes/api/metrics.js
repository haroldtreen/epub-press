const express = require('express');
const { register } = require('../../lib/metrics');

const router = express.Router();

router.get('/', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(register.metrics());
});

module.exports = router;
