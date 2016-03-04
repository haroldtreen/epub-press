'use strict';

let Config;

if (process.env.IS_PROD) {
    Config = {
        DEFAULT_COVER_PATH: '/home/ubuntu/epub-press/lib/cover.png',
        DEFAULT_EBOOK_FOLDER: '/home/ubuntu/epub-press/ebooks',
    };
} else {
    Config = {
        DEFAULT_COVER_PATH: '/Users/haroldtreen/code/web/epub-press/lib/cover.png',
        DEFAULT_EBOOK_FOLDER: '/Users/haroldtreen/code/web/epub-press/ebooks',
    };
}

module.exports = Config;
