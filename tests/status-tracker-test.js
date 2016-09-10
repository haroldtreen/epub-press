const assert = require('chai').assert;
const StatusTracker = require('../lib/status-tracker');

const id = 'id-123';
const status = 'status';
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

    describe('constants', () => {
        it('has a .MAX_STATUSES', () => {
            assert.isNumber(StatusTracker.MAX_STATUSES);
        });
    });
});
