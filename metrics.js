const express = require('express');
const metrics = require('./routes/api/metrics');

const app = express();

app.use('/metrics', metrics);

module.exports = app;
