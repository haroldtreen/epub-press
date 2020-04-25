'use strict';

const Logger = require('../lib/logger');

const log = new Logger();

const REGEXP = /Book Published/i;

const options = {
    from: new Date() - 30 * 24 * 60 * 60 * 1000, // Months worth of data
    until: new Date(),
    order: 'asc',
    limit: 1000000,
};

log.query(options, (err, result) => {
    if (err) {
        console.log(err);
    } else {
        let entries = result.file;
        if (REGEXP) {
            entries = entries.filter((entry) => REGEXP.test(entry.message));
        }

        const dateCounts = {};

        entries.forEach((entry) => {
            const entryDate = new Date(entry.timestamp);
            const entryKey = `${entryDate.getMonth()}/${entryDate.getDate()}`;

            dateCounts[entryKey] = dateCounts[entryKey] ? dateCounts[entryKey] + 1 : 1;
        });

        console.log(dateCounts);
    }
});
