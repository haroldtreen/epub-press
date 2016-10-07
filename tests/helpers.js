class TestHelpers {
    static isError(error) {
        if (typeof error === 'string') {
            return Promise.reject(new Error(error));
        }
        return Promise.resolve(error);
    }
}

module.exports = TestHelpers;
