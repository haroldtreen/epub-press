const client = require('prom-client');

const { collectDefaultMetrics } = client;
collectDefaultMetrics();

module.exports = client;
