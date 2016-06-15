const fs = require('fs');

const assert = require('chai').assert;

const ContentExtractor = require('../lib/content-extractor');

describe('Content Extractor', () => {
    describe('preprocess', () => {
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
                done();
            }).catch(done);
        });
    });

    describe('process', () => {

    });
});
