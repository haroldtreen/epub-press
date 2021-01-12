const supertest = require('supertest');
const metrics = require('../../../../metrics');

const session = supertest(metrics);

describe('Metrics', () => {
    it('returns prometheus metrics', () => {
        const request = session.get('/metrics');

        return request
            .expect(200)
            .expect('Content-Type', 'text/plain; charset=utf-8; version=0.0.4')
            .then((response) => {
                expect(response.text).toContain('nodejs_active_handles_total');
            });
    });
});
