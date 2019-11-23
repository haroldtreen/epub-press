const sinon = require('sinon');
const request = require('supertest');

const fs = require('fs');

const app = require('../../../../app');
const BookModel = require('../../../../models').Book;
const AppErrors = require('../../../../lib/app-errors');
const Book = require('../../../../lib/book');
const BookServices = require('../../../../lib/book-services');
const StatusTracker = require('../../../../lib/status-tracker');
const Mailer = require('../../../../lib/mailer');

// eslint-disable-next-line prefer-spread
const urls = Array.apply(null, { length: 1000 }).map((a, i) => `http://google.com/${i}`);
const session = request(app);

const sandbox = sinon.createSandbox();

function buildErrorsResponse(...args) {
    const errors = args.map((errorName) => {
        const error = AppErrors.getApiError(errorName);
        return AppErrors.buildApiResponse(error);
    });
    return { errors };
}

function limitLength(str) {
    const MAX_LEN = 55;
    if (str.length > MAX_LEN + 3) {
        return `${str.slice(0, MAX_LEN)}...`;
    }
    return str;
}

function buildDescription(testCase) {
    const isGET = !!testCase.get;
    let reqStr;

    if (isGET) {
        reqStr = Object.keys(testCase.get || {}).reduce((prev, current) => {
            const start = prev ? `${prev}&` : '?';
            return `${start}${current}=${testCase.get[current]}`;
        }, '');
        reqStr = reqStr && ` with ${reqStr}`;
        reqStr = `GET${reqStr}`;
    } else {
        reqStr = `POST with ${JSON.stringify(testCase.post || {})}`;
    }
    return `${limitLength(reqStr)} responds ${testCase.status}`;
}

function runTestCase(endpoint, testCase) {
    const description = buildDescription(testCase);

    it(description, (done) => {
        sandbox.restore();
        if (testCase.before) {
            testCase.before();
        }

        const method = testCase.post ? 'post' : 'get';
        const reqData = testCase[method];
        let req = session[method](endpoint);
        req = testCase.get ? req.query(reqData) : req.send(reqData);

        req.expect(testCase.status, testCase.response).end((err) => {
            if (testCase.after) {
                testCase.after();
            }
            sandbox.restore();
            done(err);
        });
    });
}

function testEndpoints(endpoints) {
    Object.keys(endpoints).forEach((endpoint) => {
        describe(endpoint, () => {
            endpoints[endpoint].forEach((testCase) => {
                runTestCase(endpoint, testCase);
            });
        });
    });
}

const BETA_ENDPOINTS = {
    '/api/books': [
        {
            post: { urls: urls.slice(0, 10) },
            status: 201,
            response: { id: '1' },
            before: () => {
                sandbox.stub(BookServices, 'publish').resolves({ getId: () => '1' });
            },
        },
        {
            post: { urls: urls.slice(0, 10) },
            status: 500,
            response: AppErrors.getApiError('DEFAULT').message,
            before: () => {
                sandbox.stub(BookServices, 'publish').rejects(new Error());
            },
        },
        {
            post: { h: 'W' },
            status: 400,
            response: AppErrors.getApiError('NO_SECTIONS_SPECIFIED').message,
        },
        {
            post: { urls },
            status: 500,
            response: AppErrors.getApiError('TOO_MANY_ITEMS').message,
        },
        {
            post: { sections: urls },
            status: 500,
            response: AppErrors.getApiError('TOO_MANY_ITEMS').message,
        },
    ],
    '/api/books/download': [
        {
            get: { id: 'DELETED-ID' },
            status: 404,
            response: AppErrors.getApiError('BOOK_NOT_FOUND').message,
            before: () => {
                sandbox.stub(BookModel, 'findOne').resolves({ uid: '123' });
            },
        },
        {
            get: {},
            status: 400,
            response: AppErrors.getApiError('NO_ID_SPECIFIED').message,
        },
        {
            get: { id: 'BAD-ID' },
            status: 404,
            response: AppErrors.getApiError('BOOK_NOT_FOUND').message,
            before: () => {
                sandbox.stub(BookModel, 'findOne').resolves(null);
            },
        },
        {
            get: { id: 'GOOD-ID' },
            status: 200,
            response: fs.readFileSync(__filename).toString(),
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => __filename });
            },
        },
        {
            get: { id: 'GOOD-ID', filetype: 'mobi' },
            status: 200,
            response: fs.readFileSync(__filename).toString(),
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getMobiPath: () => __filename });
            },
            after: () => {
                expect(Book.find.args).toEqual([['GOOD-ID', 'mobi']]);
            },
        },
        {
            get: { id: 'GOOD-ID', email: 'haroldtreen@gmail.com' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => __filename });
                sandbox.stub(Mailer, 'sendEpub').resolves();
            },
            after: () => {
                expect(Book.find.called).toBe(true);
                expect(Mailer.sendEpub.called).toBe(true);
            },
        },
        {
            get: { id: 'GOOD-ID', email: 'example@gmail.com', filetype: 'mobi' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => __filename });
                sandbox.stub(Mailer, 'sendMobi').resolves();
            },
            after: () => {
                expect(Book.find.called).toBe(true);
                expect(Mailer.sendMobi.called).toBe(true);
            },
        },
    ],
    '/api/books/email-delivery': [
        {
            get: {},
            status: 400,
            response: AppErrors.getApiError('NO_ID_SPECIFIED').message,
        },
        {
            get: { id: 'GOOD-ID' },
            status: 400,
            response: AppErrors.getApiError('NO_EMAIL_SPECIFIED').message,
        },
        {
            get: { id: 'GOOD-ID', email: 'example@gmail.com' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => __filename });
                sandbox.stub(Mailer, 'sendEpub').resolves({});
            },
            after: () => {
                expect(Book.find.called).toBe(true);
                expect(Mailer.sendEpub.called).toBe(true);
            },
        },
        {
            get: { id: 'GOOD-ID', email: 'example@gmail.com', filetype: 'mobi' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => __filename });
                sandbox.stub(Mailer, 'sendMobi').resolves({});
            },
            after: () => {
                expect(Book.find.called).toBe(true);
                expect(Mailer.sendMobi.called).toBe(true);
                expect(Book.find.args).toEqual([['GOOD-ID', 'mobi']]);
            },
        },
    ],
};

const V1_ENDPOINTS = {
    '/api/v1/books': [
        {
            post: { h: 'W' },
            status: 400,
            response: buildErrorsResponse('NO_SECTIONS_SPECIFIED'),
        },
        {
            post: { urls },
            status: 422,
            response: buildErrorsResponse('TOO_MANY_ITEMS'),
        },
        {
            post: { sections: urls },
            status: 422,
            response: buildErrorsResponse('TOO_MANY_ITEMS'),
        },
        {
            post: { sections: urls.slice(0, 10) },
            status: 202,
            response: { id: 1 },
            before: () => {
                sandbox.stub(Book.prototype, 'getId').returns(1);
                sandbox.stub(BookServices, 'publish').resolves({ getId: () => '1' });
            },
        },
        {
            post: { sections: urls.slice(0, 10) },
            status: 202,
            response: { id: 1 },
            before: () => {
                sandbox.stub(Book.prototype, 'getId').returns(1);
                sandbox.stub(BookServices, 'publish').rejects({ getId: () => '1' });
            },
        },
    ],
    '/api/v1/books/download': [
        {
            get: { id: 'id' },
            status: 404,
            response: {},
        },
    ],
    '/api/v1/books/some-id/download': [
        {
            get: {},
            status: 404,
            response: buildErrorsResponse('BOOK_NOT_FOUND'),
            before: () => {
                sandbox.stub(Book, 'find').rejects(AppErrors.getApiError('BOOK_NOT_FOUND'));
            },
        },
        {
            get: {},
            status: 200,
            response: fs.readFileSync(__filename, 'utf-8'),
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => __filename });
            },
        },
        {
            get: { filetype: 'mobi' },
            status: 200,
            response: fs.readFileSync(__filename, 'utf-8'),
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getMobiPath: () => __filename });
            },
            after: () => {
                expect(Book.find.args).toEqual([['some-id', 'mobi']]);
            },
        },
    ],
    '/api/v1/books/some-id/email': [
        {
            get: {},
            status: 400,
            response: buildErrorsResponse('NO_EMAIL_SPECIFIED'),
        },
        {
            get: { email: 'example@gmail.com' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getEpubPath: () => {} });
                sandbox.stub(Mailer, 'sendEpub').resolves({});
            },
            after: () => {
                expect(Book.find.called).toBe(true);
                expect(Mailer.sendEpub.called).toBe(true);
            },
        },
        {
            get: { email: 'example@gmail.com', filetype: 'mobi' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getMobiPath: () => {} });
                sandbox.stub(Mailer, 'sendMobi').resolves({});
            },
            after: () => {
                expect(Book.find.args).toEqual([['some-id', 'mobi']]);
            },
        },
        {
            get: { email: 'example@kindle.com', filetype: 'epub' },
            status: 200,
            response: 'Email sent!',
            before: () => {
                sandbox.stub(Book, 'find').resolves({ getMobiPath: () => {} });
                sandbox.stub(Mailer, 'sendMobi').resolves({});
                sandbox.stub(Mailer, 'sendEpub').resolves({});
            },
            after: () => {
                expect(Book.find.args).toEqual([['some-id', 'mobi']]);
                expect(Mailer.sendMobi.called).toBe(true);
                expect(Mailer.sendEpub.called).toBe(false);
            },
        },
    ],
    '/api/v1/books/some-id/status': [
        {
            get: {},
            status: 404,
            response: buildErrorsResponse('NOT_FOUND'),
        },
        {
            get: {},
            status: 200,
            response: StatusTracker.buildStatus('DEFAULT'),
            before: () => {
                sandbox
                    .stub(BookServices, 'getStatus')
                    .resolves(StatusTracker.buildStatus('DEFAULT'));
            },
        },
        {
            get: {},
            status: 500,
            response: StatusTracker.buildStatus('FAILED'),
            before: () => {
                sandbox
                    .stub(BookServices, 'getStatus')
                    .resolves(StatusTracker.buildStatus('FAILED'));
            },
        },
    ],
};

describe('Books API', () => {
    describe('beta', () => {
        testEndpoints(BETA_ENDPOINTS);
    });

    describe('v1', () => {
        testEndpoints(V1_ENDPOINTS);
    });
});
