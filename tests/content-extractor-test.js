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
        }).timeout(2500);

        it('can extract a blogspot article', (done) => {
            ContentExtractor.extract(
                fs.readFileSync(`${__dirname}/fixtures/articles/blogspot.html`).toString()
            ).then((article) => {
                assert.include(article.content, 'End the life of the hardware (brick it)');
                assert.include(article.content, 'Anytime you work on a software project,');
                done();
            }).catch(done);
        }).timeout(2500);
    });

    describe('preprocess', () => {
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

        it('should remove certain elements', (done) => {
            const html = fs.readFileSync(`${__dirname}/fixtures/invalid-elements.html`).toString();

            ContentExtractor.preprocess(html).then((preHtml) => {
                ContentExtractor.preprocess.REMOVE_ELEMENTS.forEach((element) => {
                    assert.notMatch(preHtml, new RegExp(element));
                });
                done()
            }).catch(done);
        });
    });

    describe('process', () => {

    });
});
