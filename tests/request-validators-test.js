const { assert } = require('chai');

const RequestValidators = require('../routes/helpers/request-validators');

function mockRequest(data) {
    return { body: data };
}

function isError(e) {
    if (typeof e === 'string') {
        return Promise.reject(new Error(e));
    }
    return Promise.resolve(e);
}

const urls = Array.apply(null, { length: 100 }).map((a, i) => `http://google.com/${i}`);

describe('RequestValidators', () => {
    describe('#validatePublishRequest', () => {
        it('accepts a urls attribute', () => {
            const req = mockRequest({ urls: urls.slice(0, 10) });
            return RequestValidators.validatePublishRequest(req).then((validReq) => {
                assert.equal(validReq, req);
            });
        });

        it('accepts a sections attribute', () => {
            const req = mockRequest({ sections: urls.slice(0, 10) });
            return RequestValidators.validatePublishRequest(req).then((validReq) => {
                assert.equal(validReq, req);
            });
        });

        it('requires a root level "data" attribute', () => {
            const req = mockRequest({});
            return RequestValidators.validatePublishRequest(req)
            .then(() => Promise.reject(`Expected ${req} not to be valid`))
            .catch(isError)
            .then((err) => {
                assert.equal(err.status, 422);
            });
        });

        it('requires a type of books', () => {
            const req = mockRequest({ data: { type: 'books' } });
            return RequestValidators.validatePublishRequest(req)
            .then(() => Promise.reject(`Expected ${JSON.stringify(req)} not to be valid`))
            .catch(isError)
            .then((err) => {
                assert.equal(err.status, 422);
            });
        });

        it('requires a valid number of urls', () => {
            const req = mockRequest({
                data: { type: 'books', attributes: { urls } },
            });
            return RequestValidators.validatePublishRequest(req)
            .then(() => Promise.reject(`Expected too many urls not to be valid`))
            .catch(isError)
            .then((err) => {
                assert.equal(err.status, 422);
            });
        });

        it('requires a valid number of sections', () => {
            const req = mockRequest({
                data: { type: 'books', attributes: { sections: urls } },
            });
            return RequestValidators.validatePublishRequest(req)
            .then(() => Promise.reject(`Expected too many urls not to be valid`))
            .catch(isError)
            .then((err) => {
                assert.equal(err.status, 422);
            });
        });
    });
});
