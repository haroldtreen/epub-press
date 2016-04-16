'use strict';

const path = require('path');
const Config = {};

Config.ROOT = path.resolve(`${__dirname}/..`);

Config.DEFAULT_EBOOK_FOLDER = `${Config.ROOT}/ebooks`;
Config.DEFAULT_COVER_PATH = `${Config.ROOT}/lib/cover.png`;
Config.KINDLEGEN = `${Config.ROOT}/bin/kindlegen-${process.platform}`;
Config.TMP = `${Config.ROOT}/tmp`;
Config.IMAGES_TMP = `${Config.TMP}/images`;
Config.DOCS_PATH = `${Config.ROOT}/public/docs`;
Config.LOGS_PATH = process.env === 'test' ? `${Config.ROOT}/tmp/logs` : `${Config.ROOT}/logs`;

module.exports = Config;
