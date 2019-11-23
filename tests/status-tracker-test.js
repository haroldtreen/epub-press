const StatusTracker = require('../lib/status-tracker');

const id = 'id-123';
const status = StatusTracker.buildStatus();

// eslint-disable-next-line prefer-spread
const statuses = Array.apply(null, { length: StatusTracker.MAX_STATUSES }).map((a, i) => i);

let tracker;

describe('StatusTracker', () => {
    beforeEach(() => {
        tracker = new StatusTracker();
    });

    describe('#setStatus', () => {
        it('can set a status', () => {
            expect(tracker.setStatus(id, status)).not.toBeDefined();
        });

        it('clears excessive statuses', () => {
            statuses.forEach((el) => {
                tracker.setStatus(el, status);
            });

            expect(tracker.getStatus(0)).not.toBeDefined();

            statuses.forEach((el) => {
                if (el) expect(tracker.getStatus(el)).toBeDefined();
            });
        });

        it('only tracks unique keys', () => {
            expect(tracker.keys.length).toBe(0);
            tracker.setStatus(id, status);
            tracker.setStatus(id, status);
            expect(tracker.keys.length).toBe(1);
        });
    });

    describe('#getStatus', () => {
        it('can get a status', () => {
            tracker.setStatus(id, status);
            expect(tracker.getStatus(id)).toEqual(status);
        });
    });

    describe('#clearStatus', () => {
        it('can clear a status', () => {
            tracker.setStatus(id, status);
            tracker.clearStatus(id);

            expect(tracker.getStatus(id)).not.toBeDefined();
        });
    });

    describe('.buildStatus', () => {
        it('has a default', () => {
            const builtStatus = StatusTracker.buildStatus('DOES_NOT_EXIST');
            expect(builtStatus.message.toLowerCase()).toContain('unknown');
            expect(builtStatus.progress).toEqual(0);
        });

        it('returns the correct status', () => {
            Object.keys(StatusTracker.STATUSES).forEach((statusType) => {
                const storedMessage = StatusTracker.STATUSES[statusType].message;
                const builtMessage = StatusTracker.buildStatus(statusType).message;
                expect(storedMessage).toEqual(builtMessage);
            });
        });

        it('has failures', () => {
            const builtStatus = StatusTracker.buildStatus('FAILED');
            expect(builtStatus.message.toLowerCase()).toContain('fail');
            expect(builtStatus.httpStatus).toBeDefined();
        });
    });

    describe('constants', () => {
        it('has a .MAX_STATUSES', () => {
            expect(typeof StatusTracker.MAX_STATUSES).toBe('number');
        });

        it('has STATUS_TYPES', () => {
            Object.keys(StatusTracker.STATUSES).forEach((statusType) => {
                expect(StatusTracker.STATUS_TYPES[statusType]).toEqual(statusType);
            });
        });
    });
});
