const fs = require('fs');

const DocumentationLoader = require('../lib/documentation-loader');
const Config = require('../lib/config');

describe('Documentation Loader', () => {
    it('is constructed with a path', () => {
        const loader = new DocumentationLoader(Config.DOCS_PATH);

        expect(loader._path).toEqual(Config.DOCS_PATH);
    });

    it('loads all markdown files', (done) => {
        const loader = new DocumentationLoader(Config.DOCS_PATH);

        fs.readdir(Config.DOCS_PATH, (err, files) => {
            loader
                .readDocs()
                .then((docs) => {
                    expect(docs.length).toBe(files.length - 2);
                    docs.forEach((doc) => {
                        expect('title' in doc).toBeTruthy();
                        expect('html' in doc).toBeTruthy();
                        expect('markdown' in doc).toBeTruthy();
                    });
                    done();
                })
                .catch(done);
        });
    });
});
