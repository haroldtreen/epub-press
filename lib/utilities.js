'use strict';

const fs = require('fs-extra');
const Logger = require('./logger');

const log = new Logger();

class Utilities {
    static removeFiles(filesArray) {
        const promises = filesArray.map(
            (file) =>
                new Promise((resolve, reject) => {
                    fs.remove(file, (err) => {
                        if (err) {
                            log.exception('Utilities.removeFiles')(err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                })
        );
        return Promise.all(promises);
    }
}

module.exports = Utilities;
