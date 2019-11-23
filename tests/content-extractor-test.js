const fs = require('fs');

const ContentExtractor = require('../lib/content-extractor');

describe('Content Extractor', () => {
    describe('preprocess', () => {
        it('should remove certain elements', (done) => {
            const html = fs.readFileSync(`${__dirname}/fixtures/invalid-elements.html`).toString();

            ContentExtractor.preprocess(html)
                .then((preHtml) => {
                    ContentExtractor.preprocess.REMOVE_ELEMENTS.forEach((element) => {
                        expect(preHtml).not.toMatch(new RegExp(element));
                    });
                    done();
                })
                .catch(done);
        });
    });

    describe('site specific operations', () => {
        const realOperations = ContentExtractor.URL_SPECIFIC_OPERATIONS;
        beforeAll(() => {
            ContentExtractor.URL_SPECIFIC_OPERATIONS = {
                'quora.com': {
                    removeElement: ['.quora-junk'],
                },
            };
        });

        afterAll(() => {
            ContentExtractor.URL_SPECIFIC_OPERATIONS = realOperations;
        });

        it('can perform specific operations for a matching url', (done) => {
            const url = 'www.quora.com/question';
            const html = '<html><div class="quora-junk"></div></html>';
            ContentExtractor.runUrlSpecificOperations(html, url)
                .then((newHtml) => {
                    expect(newHtml).not.toContain('quora-junk');
                    expect(newHtml).not.toContain('</div>');
                    done();
                })
                .catch(done);
        });

        it('can do nothing when no operations exist', (done) => {
            const url = 'http://google.coom';
            const html = '<html></html>';
            ContentExtractor.runUrlSpecificOperations(html, url)
                .then((newHtml) => {
                    expect(newHtml).toEqual(html);
                    done();
                })
                .catch(done);
        });
    });
});
