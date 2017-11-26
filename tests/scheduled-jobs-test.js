const fs = require('fs');

const ScheduledJobs = require('../lib/scheduled-jobs');
const Config = require('../lib/config');
const TestHelpers = require('./helpers');

describe('ScheduledJobs', () => {
    describe('.cleanEbooks', () => {
        it('should remove all old ebooks', () => {
            const fakeBook = `${Config.DEFAULT_EBOOK_FOLDER}/fakebook.epub`;
            const threeDays = 60 * 60 * 24 * 3;
            const today = Date.now() / 1000;
            const threeDaysAgo = today - threeDays;
            fs.writeFileSync(fakeBook, 'Im a book');
            fs.utimesSync(fakeBook, threeDaysAgo, threeDaysAgo);

            return ScheduledJobs.cleanEbooks().then(() => TestHelpers.assertNoFile(fakeBook));
        });
    });
});
