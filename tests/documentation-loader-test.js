const DocumentationLoader = require('../lib/documentation-loader');
const Config = require('../lib/config');
const fs = require('fs');

const assert = require('chai').assert;

describe('Documentation Loader', () => {
    it('is constructed with a path', () => {
        const loader = new DocumentationLoader(Config.DOCS_PATH);

        assert.equal(loader._path, Config.DOCS_PATH);
    });

    it('loads all markdown files', (done) => {
        const loader = new DocumentationLoader(Config.DOCS_PATH);

        fs.readdir(Config.DOCS_PATH, (err, files) => {
            loader.readDocs().then((docs) => {
                assert.lengthOf(docs, files.length - 2);
                docs.forEach((doc) => {
                    assert.property(doc, 'title');
                    assert.property(doc, 'html');
                    assert.property(doc, 'markdown');
                });
                done();
            }).catch(done);
        });
    });
});
