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
const defaultMetadata = {
    id: Date.now(),
    author: 'Epub Press',
    title: 'Custom Book',
    description: 'Best. Book. Ever.',
    genre: 'ooo',
    images: [],
};

let Services = require('./services');

const someUrls = [
    'http://www.theverge.com/2016/2/24/11109942/microsoft-xamarin-acquisition-mobile-app-development',
    'http://googleresearch.blogspot.com.co/2016/02/on-personalities-of-dead-authors.html',
    'http://appleinsider.com/articles/16/02/24/apple-releases-apple-tv-tech-talks-video-series-for-building-better-tvos-apps',
    'http://www.bbc.com/news/world-asia-35664794',
    'http://edition.cnn.com/2016/02/25/politics/republican-debate-what-to-watch/index.html',
];
const coverPath = '/Users/haroldtreen/code/web/epub-press/lib/cover.jpg';
const outputPath = '/Users/haroldtreen/code/web/epub-press/ebooks';
const ebookTitle = 'example-ebook';

class EpubGenerator {
    static fromUrls(title, urls) {
        const generatedPromise = new Promise((resolve, reject) => {
            defaultMetadata.title = title;
            const ebook = nodepub.document(defaultMetadata, coverPath);

            console.log('Fetching HTML');
            Services.urlsToHtml(urls).then((htmls) => {
                console.log('Extracting Articles');
                return Services.extractArticles(htmls);
            }).then((articles) => {
                console.log('Converting to XHTML');
                return Services.articlesToXhtml(articles);
            }).then((articles) => {
                console.log('Creating Ebook');
                articles.forEach((article) => {
                    ebook.addSection(article.title, `<h1>${article.title}</h1>${article.content}`);
                });
                ebook.writeEPUB((e) => {
                    console.log(e.stack);
                    reject(e);
                }, outputPath, ebookTitle + defaultMetadata.id, () => {
                    console.log('EPUB created.');
                    resolve(defaultMetadata.id);
                });
            });
        });
        return generatedPromise;
    }
}

// EpubGenerator.fromUrls('hi', someUrls).then(() => {
//     console.log('DONE!');
// });

module.exports = EpubGenerator;
