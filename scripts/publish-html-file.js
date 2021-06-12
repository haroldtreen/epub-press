/*
Publish HTML File

Script for publishing random local html files.
node scripts/publish-html-file.js <path_to_html> [url]

Useful for debugging one off blocks of html.
*/

const fs = require('fs');
const Book = require('../lib/book');
const BookServices = require('../lib/book-services');

const html = fs.readFileSync(process.argv[2], 'UTF-8');

const book = Book.fromJSON({
    title: 'HTML File Test',
    sections: [{ url: process.argv[3] || 'https://epub.press', html }],
});

BookServices.publish(book);
