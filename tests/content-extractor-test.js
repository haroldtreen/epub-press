const fs = require('fs');

const assert = require('chai').assert;

const ContentExtractor = require('../lib/content-extractor');

describe('Content Extractor', () => {
    describe('extract', () => {
        it('can extract a new york times articles', (done) => {
            ContentExtractor.extract(
                fs.readFileSync(`${__dirname}/fixtures/articles/new-york-times.html`).toString()
            ).then((article) => {
                assert.notInclude(article.content, '<script>');
                assert.match(article.content, /BARF/);
                assert.equal(
                    article.title,
                    'In Cramped and Costly Bay Area, Cries to Build, Baby, Build'
                );
                done();
            }).catch(done);
        });
    });

    describe('preprocess', () => {
        it('should remove script tags', (done) => {
            ContentExtractor.preprocess(
                fs.readFileSync(`${__dirname}/fixtures/scripts.html`).toString()
            ).then((html) => {
                assert.notMatch(html, /<script>/);
                done();
            }).catch(done);
        });

        it('should bubble up no script content', (done) => {
            const html = fs.readFileSync(`${__dirname}/fixtures/noscript.html`).toString();
            ContentExtractor.preprocess(html).then((preHtml) => {
                assert.notMatch(preHtml, /<noscript>/);
                assert.include(preHtml, '<p>Hello!</p>');
                done();
            }).catch(done);
        });

        it('should remove things with a hidden class', (done) => {
            const html = fs.readFileSync(`${__dirname}/fixtures/hidden.html`).toString();
            ContentExtractor.preprocess(html).then((preHtml) => {
                assert.notMatch(preHtml, /hidden/);
                done();
            }).catch(done);
        });
    });

    describe('process', () => {

    });
});
