'use strict';

const { exec } = require('child_process');

const Config = require('./config');
const Logger = require('./logger');

const log = new Logger();

class ScheduledJobs {
    static cleanEbooks() {
        return new Promise((resolve, reject) => {
            const ebookFolder = Config.DEFAULT_EBOOK_FOLDER;
            const cleanCmd = `find ${ebookFolder} \\( -name *.epub -o -name *.mobi \\) -mtime +0 -delete`;
            exec(cleanCmd, (error) => {
                if (error) {
                    log.warn('Cleaning failed:', { error });
                    return reject(error);
                }
                return resolve();
            });
        });
    }
}

module.exports = ScheduledJobs;
