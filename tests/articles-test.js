const assert = require('chai').assert;
const fs = require('fs');
const ContentExtractor = require('../lib/content-extractor');

const articleFixtures = `${__dirname}/fixtures/articles`;

describe('Article Extraction', () => {
    it('can extract a new york times articles', (done) => {
        ContentExtractor.extract(
            fs.readFileSync(`${articleFixtures}/new-york-times.html`).toString()
        ).then((article) => {
            assert.notInclude(article.content, '<script>');
            assert.include(article.content, 'The organization also inflamed Sierra Club');
            assert.equal(
                article.title,
                'In Cramped and Costly Bay Area, Cries to Build, Baby, Build'
            );
            done();
        }).catch(done);
    }).timeout(4000);

    it('can extract blogspot articles', (done) => {
        ContentExtractor.extract(
            fs.readFileSync(`${articleFixtures}/blogspot.html`).toString()
        ).then((article) => {
            assert.include(article.content, 'End the life of the hardware (brick it)');
            assert.include(article.content, 'Anytime you work on a software project,');
            done();
        }).catch(done);
    });

    it('can extract a elastic search articles', (done) => {
        ContentExtractor.extract(
            fs.readFileSync(`${articleFixtures}/elastic-search.html`).toString()
        ).then((article) => {
            assert.include(article.content, 'which we can use to see how our cluster is doing');
            assert.include(article.content, 'Here, we can see our one node named');
            done();
        }).catch(done);
    }).timeout(2500);
});
