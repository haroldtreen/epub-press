const assert = require('chai').assert;
const StatusTracker = require('../lib/status-tracker');

const id = 'id-123';
const status = StatusTracker.buildStatus();
const statuses = Array.apply(null, {
    length: StatusTracker.MAX_STATUSES,
}).map((a, i) => i);

let tracker;

describe('StatusTracker', () => {
    beforeEach(() => {
        tracker = new StatusTracker();
    });

    describe('#setStatus', () => {
        it('can set a status', () => {
            assert.isUndefined(tracker.setStatus(id, status));
        });

        it('clears excessive statuses', () => {
            statuses.forEach((el) => {
                tracker.setStatus(el, status);
            });

            assert.isUndefined(tracker.getStatus(0));

            statuses.forEach((el) => {
                if (el) assert.isDefined(tracker.getStatus(el));
            });
        });

        it('only tracks unique keys', () => {
            assert.lengthOf(tracker.keys, 0);
            tracker.setStatus(id, status);
            tracker.setStatus(id, status);
            assert.lengthOf(tracker.keys, 1);
        });
    });

    describe('#getStatus', () => {
        it('can get a status', () => {
            tracker.setStatus(id, status);
            assert.equal(tracker.getStatus(id), status);
        });
    });

    describe('#clearStatus', () => {
        it('can clear a status', () => {
            tracker.setStatus(id, status);
            tracker.clearStatus(id);

            assert.isUndefined(tracker.getStatus(id));
        });
    });

    describe('.buildStatus', () => {
        it('has a default', () => {
            const builtStatus = StatusTracker.buildStatus('DOES_NOT_EXIST');
            assert.include(builtStatus.message.toLowerCase(), 'unknown');
            assert.equal(builtStatus.progress, 0);
        });

        it('returns the correct status', () => {
            Object.keys(StatusTracker.STATUSES).forEach((statusType) => {
                const storedMessage = StatusTracker.STATUSES[statusType].message;
                const builtMessage = StatusTracker.buildStatus(statusType).message;
                assert.equal(storedMessage, builtMessage);
            });
        });

        it('has failures', () => {
            const builtStatus = StatusTracker.buildStatus('FAILED');
            assert.include(builtStatus.message.toLowerCase(), 'fail');
            assert.isDefined(builtStatus.httpStatus);
        });
    });

    describe('constants', () => {
        it('has a .MAX_STATUSES', () => {
            assert.isNumber(StatusTracker.MAX_STATUSES);
        });
    });
});
