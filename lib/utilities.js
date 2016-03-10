'use strict';

const fs = require('fs-extra');

class Utilities {
    static removeFiles(filesArray) {
        const promises = filesArray.map((file) => new Promise((resolve, reject) => {
            fs.remove(file, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }));
        return Promise.all(promises);
    }
}

module.exports = Utilities;
