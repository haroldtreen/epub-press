const AppErrors = require('../lib/app-errors.js');

describe('AppErrors', () => {
    describe('#api', () => {
        it('is an object', () => {
            expect(typeof AppErrors.api).toBe('object');
        });

        it('has objects with messages and statuses', () => {
            const keys = Object.keys(AppErrors.api);
            expect(keys.length > 0).toBe(true);
            keys.forEach((key) => {
                expect(typeof AppErrors.api[key].status).toBe('string');
                expect(typeof AppErrors.api[key].message).toBe('string');
            });
        });
    });

    describe('methods', () => {
        describe('#getApiError', () => {
            it('returns errors error', () => {
                const apiErrors = Object.keys(AppErrors.api);
                apiErrors.forEach((name) => {
                    const error = AppErrors.getApiError(name);
                    expect(AppErrors.getApiError(name)).toBeInstanceOf(Error);
                    expect(error.message).toEqual(AppErrors.api[name].message);
                });
            });

            it('returns a default when no error is found', () => {
                const notAnError = AppErrors.getApiError('NOT_AN_ERROR');
                const defaultError = AppErrors.api.DEFAULT;

                expect(notAnError.message).toEqual(defaultError.message);
                expect(notAnError.status).toEqual(defaultError.status);
            });

            it('returns actual errors', () => {
                expect(AppErrors.getApiError('DEFAULT')).toBeInstanceOf(Error);
            });

            it('infers system level errors', () => {
                const systemError = new Error('request entity too large');
                const apiError = AppErrors.getApiError(systemError);
                expect(apiError.message).toEqual(AppErrors.api.TOO_LARGE_REQUEST.message);
            });
        });

        describe('#buildErrorResponse', () => {
            it('uses the supplied status', () => {
                const status = 'A status';
                const error = AppErrors.buildApiResponse({ status });

                expect(error.status).toEqual(status);
                expect(error.detail).toEqual(AppErrors.api.DEFAULT.message);
            });

            it('uses the supplied message', () => {
                const message = 'A message';
                const error = AppErrors.buildApiResponse({ message });

                expect(error.detail).toEqual(message);
                expect(error.status).toEqual(AppErrors.api.DEFAULT.status);
            });
        });
    });
});
