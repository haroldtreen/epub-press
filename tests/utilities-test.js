const fs = require('fs-extra');

const Utilities = require('../lib/utilities');
const Config = require('../lib/config');

describe('Utilities', () => {
    it('can remove an array of files', (done) => {
        const files = [];
        ['1', '2', '3'].forEach((num) => {
            const file = `${Config.TMP}/${num}.txt`;
            fs.writeFileSync(file, 'Hello World');
            files.push(file);
        });

        Utilities.removeFiles(files)
            .then(() => {
                fs.readdir(`${Config.TMP}`, (err, dirFiles) => {
                    dirFiles.forEach((file) => {
                        expect(file).not.toMatch(/\.txt/);
                    });
                    done();
                });
            })
            .catch(done);
    });
});
