const fs = require('fs');

const assert = require('chai').assert;

const ContentExtractor = require('../lib/content-extractor');

describe('Content Extractor', () => {
    describe('preprocess', () => {
        it('should remove certain elements', (done) => {
            const html = fs
        .readFileSync(`${__dirname}/fixtures/invalid-elements.html`)
        .toString();

            ContentExtractor.preprocess(html)
        .then((preHtml) => {
            ContentExtractor.preprocess.REMOVE_ELEMENTS.forEach((element) => {
                assert.notMatch(preHtml, new RegExp(element));
            });
            done();
        })
        .catch(done);
        });
    });

    describe('site specific operations', () => {
        const realOperations = ContentExtractor.URL_SPECIFIC_OPERATIONS;
        before(() => {
            ContentExtractor.URL_SPECIFIC_OPERATIONS = {
                'quora\.com': {
                    removeElement: ['.quora-junk'],
                },
            };
        });

        after(() => {
            ContentExtractor.URL_SPECIFIC_OPERATIONS = realOperations;
        });

        it('can perform specific operations for a matching url', (done) => {
            const url = 'www.quora.com/question';
            const html = '<html><div class="quora-junk"></div></html>';
            ContentExtractor.runUrlSpecificOperations(html, url)
        .then((newHtml) => {
            assert.notInclude(newHtml, 'quora-junk');
            assert.notInclude(newHtml, '</div>');
            done();
        })
        .catch(done);
        });

        it('can do nothing when no operations exist', (done) => {
            const url = 'http://google.coom';
            const html = '<html></html>';
            ContentExtractor.runUrlSpecificOperations(html, url)
        .then((newHtml) => {
            assert.equal(newHtml, html);
            done();
        })
        .catch(done);
        });
    });
});
