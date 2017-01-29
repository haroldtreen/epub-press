const fs = require('fs');

const ScheduledJobs = require('../lib/scheduled-jobs');
const Config = require('../lib/config');

function assertNoFile(filename) {
    return new Promise((resolve, reject) => {
        fs.stat(filename, (err) => {
            if (err) {
                resolve();
            } else {
                reject(new Error(`${filename} found`));
            }
        });
    });
}

describe('ScheduledJobs', () => {
    describe('.cleanEbooks', () => {
        it('should remove all old ebooks', () => {
            const fakeBook = `${Config.DEFAULT_EBOOK_FOLDER}/fakebook.epub`;
            const threeDaysAgo = (Date.now() / 1000) - (60 * 60 * 24 * 3);
            fs.writeFileSync(fakeBook, 'Im a book');
            fs.utimesSync(fakeBook, threeDaysAgo, threeDaysAgo);

            return ScheduledJobs.cleanEbooks()
                    .then(() => assertNoFile(fakeBook));
        });
    });
});
