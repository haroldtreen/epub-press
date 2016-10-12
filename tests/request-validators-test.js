const { assert } = require('chai');
const { isError } = require('./helpers');

const RequestValidators = require('../routes/helpers/request-validators');

function mockRequest(data) {
    return { body: data };
}

const urls = Array.apply(null, { length: 100 }).map((a, i) => `http://google.com/${i}`);

describe('RequestValidators', () => {
    describe('#validatePublishRequest', () => {
        it('accepts a urls in the body', () => {
            const req = mockRequest({ urls: urls.slice(0, 10) });
            return RequestValidators.validatePublishRequest(req).then((validReq) => {
                assert.equal(validReq, req);
            });
        });

        it('accepts a sections in the body', () => {
            const req = mockRequest({ sections: urls.slice(0, 10) });
            return RequestValidators.validatePublishRequest(req).then((validReq) => {
                assert.equal(validReq, req);
            });
        });

        it('requires sections/urls to be in the body', () => {
            const req = mockRequest({});
            return RequestValidators.validatePublishRequest(req)
            .then(() => Promise.reject(`Expected ${req} not to be valid`))
            .catch(isError)
            .then((err) => {
                assert.equal(err.status, 400);
            });
        });

        it('requires a valid number of urls', () => {
            const req = mockRequest({
                urls,
            });
            return RequestValidators.validatePublishRequest(req)
            .then(() => Promise.reject('Expected too many urls not to be valid.'))
            .catch(isError)
            .then((err) => {
                assert.equal(err.status, 422);
            });
        });

        it('requires a valid number of sections', () => {
            const req = mockRequest({
                sections: urls,
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
