const sinon = require('sinon');
require('sinon-as-promised');
const request = require('supertest');

const app = require('../../../../app');
const BookModel = require('../../../../models').Book;
const AppErrors = require('../../../../lib/app-errors');
const Book = require('../../../../lib/book');
const BookServices = require('../../../../lib/book-services');

function buildErrorsResponse(...args) {
    const errors = args.map((errorName) => {
        const error = AppErrors.getApiError(errorName);
        return AppErrors.buildApiResponse(error);
    });
    return { errors };
}

function buildDescription(testCase) {
    const MAX_LEN = 50;
    const reqBody = testCase.post ? JSON.stringify(testCase.post) : JSON.stringify(testCase.get);
    const bodyStr = reqBody.length > MAX_LEN ? `${reqBody.slice(0, MAX_LEN - 3)}...` : reqBody;
    return `responds ${testCase.status} to ${bodyStr}`;
}

function runTestCase(endpoint, testCase) {
    const description = buildDescription(testCase);

    it(description, (done) => {
        if (testCase.before) { testCase.before(); }

        const method = testCase.post ? 'post' : 'get';
        const reqData = testCase[method];
        let req = session[method](endpoint);
        req = method === 'get' ? req.query(reqData) : req.send(reqData);
        req.expect(testCase.status, testCase.response).end((err) => {
            if (testCase.after) { testCase.after(); }
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

const urls = Array.apply(null, { length: 1000 }).map((a, i) => `http://google.com/${i}`);
const session = request(app);

const BETA_ENDPOINTS = {
    '/api/books': [
        {
            post: { urls: urls.slice(0, 10) },
            status: 201,
            response: { id: '1' },
            before: () => {
                sinon.stub(BookServices, 'publish').resolves({ getId: () => '1' });
            },
            after: () => {
                BookServices.publish.restore();
            },
        },
        {
            post: { urls: urls.slice(0, 10) },
            status: 500,
            response: buildErrorsResponse('DEFAULT'),
            before: () => {
                sinon.stub(BookServices, 'publish').rejects(new Error());
            },
            after: () => {
                BookServices.publish.restore();
            },
        },
        { post: { h: 'W' }, status: 422, response: buildErrorsResponse('NO_SECTIONS_SPECIFIED') },
        { post: { urls }, status: 422, response: buildErrorsResponse('TOO_MANY_ITEMS') },
        { post: { sections: urls }, status: 422, response: buildErrorsResponse('TOO_MANY_ITEMS') },
    ],
    '/api/books/download': [
        {
            get: { id: 'GOOD-ID' },
            status: 404,
            response: buildErrorsResponse('BOOK_NOT_FOUND'),
            before: () => {
                sinon.stub(BookModel, 'findOne').resolves({ uid: '123' });
            },
            after: () => { BookModel.findOne.restore(); },
        },
        { get: {}, status: 422, response: buildErrorsResponse('NO_ID_SPECIFIED') },
        {
            get: { id: 'BAD-ID' },
            status: 404,
            response: buildErrorsResponse('BOOK_NOT_FOUND'),
            before: () => {
                sinon.stub(BookModel, 'findOne').resolves(null);
            },
            after: () => { BookModel.findOne.restore(); },
        },
    ],
    '/api/books/status': [
        { get: {}, status: 422, response: buildErrorsResponse('NO_ID_SPECIFIED') },
        { get: { id: 'BAD-ID' }, status: 404, response: buildErrorsResponse('NOT_FOUND') },
    ],
};

const V1_ENDPOINTS = {
    '/api/v1/books': [
        {
            post: { h: 'W' },
            status: 422,
            response: buildErrorsResponse('NO_SECTIONS_SPECIFIED')
        },
        {
            post: { urls },
            status: 422,
            response: buildErrorsResponse('TOO_MANY_ITEMS')
        },
        {
            post: { sections: urls },
            status: 422,
            response: buildErrorsResponse('TOO_MANY_ITEMS')
        },
        {
            post: { sections: urls.slice(0, 10) },
            status: 202,
            response: { id: 1 },
            before: () => {
                sinon.stub(Book.prototype, 'getId').returns(1);
                sinon.stub(BookServices, 'publish').resolves({ getId: () => '1' });
            },
            after: () => {
                BookServices.publish.restore();
                Book.prototype.getId.restore();
            },
        },
        {
            post: { sections: urls.slice(0, 10) },
            status: 202,
            response: { id: 1 },
            before: () => {
                sinon.stub(Book.prototype, 'getId').returns(1);
                sinon.stub(BookServices, 'publish').rejects({ getId: () => '1' });
            },
            after: () => {
                BookServices.publish.restore();
                Book.prototype.getId.restore();
            },
        }
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
