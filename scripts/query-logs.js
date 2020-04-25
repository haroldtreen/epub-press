'use strict';

const program = require('commander');
const Logger = require('../lib/logger');

const log = new Logger();

program
    .version('0.0.1')
    .option('-f, --fields [fields]', 'Fields to show')
    .option('-n, --number [number]', 'Number of logs to search')
    .option('-r, --regex [regex]', 'Filter by regex')
    .option('-l, --level [level]', 'Filter by log level')
    .option('-s, --start [start]', 'Filter by log level')
    .parse(process.argv);

const LEVEL = program.level || false;
const NUMBER = program.number || 10000;
const REGEXP = new RegExp(program.regex, 'i') || false;
const START = program.start || 0;

const fields = program.fields || '';
const options = {
    from: new Date() - 7 * 24 * 60 * 60 * 1000, // Weeks worth of data
    until: new Date(),
    order: 'asc',
    start: START,
    limit: NUMBER,
};

if (fields) {
    options.fields = fields.split(',');
}

log.query(options, (err, result) => {
    if (err) {
        console.log(err);
    } else {
        let entries = result.file;
        if (LEVEL) {
            entries = entries.filter((entry) => entry.level === LEVEL);
        }
        if (REGEXP) {
            entries = entries.filter((entry) => REGEXP.test(entry.message));
        }

        console.log(entries);
    }
});
