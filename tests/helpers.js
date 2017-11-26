const fs = require('fs');

class TestHelpers {
    static isError(error) {
        if (typeof error === 'string') {
            return Promise.reject(new Error(error));
        }
        return Promise.resolve(error);
    }

    static assertNoFile(filename) {
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
}

module.exports = TestHelpers;
