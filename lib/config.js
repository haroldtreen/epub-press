'use strict';

const path = require('path');

const Config = {};

// DB Config
Config.DB_USERNAME = process.env.DB_USERNAME || 'postgres';
Config.DB_PASSWORD = process.env.DB_PASSWORD || 'password';
Config.DB_HOST = process.env.DB_HOST || '127.0.0.1';

// Root Folders
Config.ROOT = path.resolve(`${__dirname}/..`);
Config.TMP = `${Config.ROOT}/tmp`;

// Folder Paths
Config.IMAGES_TMP = `${Config.TMP}/images`;
Config.COVERS_TMP = `${Config.TMP}/covers`;
Config.DOCS_PATH = `${Config.ROOT}/public/docs`;
Config.ASSETS_PATH = `${Config.ROOT}/assets`;
Config.LOGS_PATH = /test/i.test(process.env.NODE_ENV)
    ? `${Config.ROOT}/tmp/logs`
    : `${Config.ROOT}/logs`;

// Filepaths
Config.DEFAULT_EBOOK_FOLDER = `${Config.ROOT}/ebooks`;
Config.DEFAULT_COVER_PATH = `${Config.ASSETS_PATH}/cover.jpg`;
Config.DEFAULT_CSS_PATH = `${Config.ASSETS_PATH}/ebook.css`;
Config.KINDLEGEN = `${Config.ROOT}/bin/kindlegen-${process.platform}`;

module.exports = Config;
