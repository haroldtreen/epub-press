'use strict';

/*
Steps:
1) For Each URL (URL -> Clean XHTML)
    - Download HTML
    - Extract the content
    - Convert to XHTML
2) For Each clean HTML
    - Add section
3) Save Book

[URLs/HTML] -> HTML -> Clean HTML -> XHTML
[XHTML] -> Sections -> Ebook

*/
const nodepub = require('nodepub');
const async = require('async');
const defaultMetadata = {
    id: Date.now(),
    author: 'Epub Press',
    title: 'Custom Book',
    description: 'Best. Book. Ever.',
    genre: 'ooo',
    images: [],
};


const Services = require('./services');

const someUrls = [
    'http://www.theverge.com/2016/2/24/11109942/microsoft-xamarin-acquisition-mobile-app-development',
    'http://googleresearch.blogspot.com.co/2016/02/on-personalities-of-dead-authors.html',
    'http://appleinsider.com/articles/16/02/24/apple-releases-apple-tv-tech-talks-video-series-for-building-better-tvos-apps',
    'http://www.bbc.com/news/world-asia-35664794',
    'http://edition.cnn.com/2016/02/25/politics/republican-debate-what-to-watch/index.html',
];
const coverPath = '/Users/haroldtreen/code/web/epub-press/lib/cover.jpg';
const outputPath = '/Users/haroldtreen/code/web/epub-press';
const ebookTitle = 'example-ebook';

class EpubGenerator {
    static fromUrls(urls) {
        const ebook = nodepub.document(defaultMetadata, coverPath);

        Services.urlsToHtml(urls).then((htmls) =>
            Services.extractArticles(htmls)
        ).then((articles) =>
            Services.articlesToXhtml(articles)
        ).then((articles) => {
            articles.forEach((article) => {
                ebook.addSection(article.title, `<h1>${article.title}</h1>${article.content}`);
            });
            ebook.writeEPUB((e) => {
                console.log(e.stack);
            }, outputPath, ebookTitle, () => {
                console.log('EPUB created.');
            });
        });
    }
}

EpubGenerator.fromUrls(someUrls);

// module.export = EpubGenerator;
