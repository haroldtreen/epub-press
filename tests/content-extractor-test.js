const fs = require('fs');

const assert = require('chai').assert;

const ContentExtractor = require('../lib/content-extractor');

describe('Content Extractor', () => {
    it('can extract a new york times articles', (done) => {
        ContentExtractor.parse(
            'http://www.nytimes.com/2016/04/17/business/economy/',
            fs.readFileSync(`${__dirname}/fixtures/articles/new-york-times.html`).toString()
        ).then((article) => {
            assert.notInclude(article.content, '<style>');
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
