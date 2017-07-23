'use strict';

const path = require('path');

const Config = {};

Config.ROOT = path.resolve(`${__dirname}/..`);

Config.DEFAULT_EBOOK_FOLDER = `${Config.ROOT}/ebooks`;
Config.DEFAULT_COVER_PATH = `${Config.ROOT}/lib/cover.jpg`;
Config.DEFAULT_CSS_PATH = `${Config.ROOT}/lib/ebook.css`;
Config.KINDLEGEN = `${Config.ROOT}/bin/kindlegen-${process.platform}`;
Config.TMP = `${Config.ROOT}/tmp`;
Config.IMAGES_TMP = `${Config.TMP}/images`;
Config.COVERS_TMP = `${Config.TMP}/covers`;
Config.DOCS_PATH = `${Config.ROOT}/public/docs`;
Config.LOGS_PATH = /test/i.test(process.env.NODE_ENV)
    ? `${Config.ROOT}/tmp/logs`
    : `${Config.ROOT}/logs`;

module.exports = Config;
