const { assert } = require('chai');
const AppErrors = require('../lib/app-errors.js');

describe('AppErrors', () => {
    describe('#api', () => {
        it('is an object', () => {
            assert.isObject(AppErrors.api);
        });

        it('has objects with messages and statuses', () => {
            const keys = Object.keys(AppErrors.api);
            assert.isTrue(keys.length > 0);
            keys.forEach((key) => {
                assert.isString(AppErrors.api[key].status);
                assert.isString(AppErrors.api[key].message);
            });
        });
    });

    describe('methods', () => {
        describe('#getApiError', () => {
            it('returns errors error', () => {
                const apiErrors = Object.keys(AppErrors.api);
                apiErrors.forEach((name) => {
                    const error = AppErrors.getApiError(name);
                    assert.instanceOf(AppErrors.getApiError(name), Error);
                    assert.equal(error.message, AppErrors.api[name].message);
                });
            });

            it('returns a default when no error is found', () => {
                const notAnError = AppErrors.getApiError('NOT_AN_ERROR');
                const defaultError = AppErrors.api.DEFAULT;

                assert.equal(notAnError.message, defaultError.message);
                assert.equal(notAnError.status, defaultError.status);
            });

            it('returns actual errors', () => {
                assert.instanceOf(AppErrors.getApiError('DEFAULT'), Error);
            });
            
            it('infers system level errors', () => {
                const systemError = new Error('request entity too large');
                const apiError = AppErrors.getApiError(systemError);
                assert.equal(apiError.message, AppErrors.api.TOO_LARGE_REQUEST.message);
            });
        });

        describe('#buildErrorResponse', () => {
            it('uses the supplied status', () => {
                const status = 'A status';
                const error = AppErrors.buildApiResponse({ status });

                assert.equal(error.status, status);
                assert.equal(error.detail, AppErrors.api.DEFAULT.message);
            });

            it('uses the supplied message', () => {
                const message = 'A message';
                const error = AppErrors.buildApiResponse({ message });

                assert.equal(error.detail, message);
                assert.equal(error.status, AppErrors.api.DEFAULT.status);
            });
        });
    });
});
