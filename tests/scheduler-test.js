const assert = require('chai').assert;

const Scheduler = require('../lib/scheduler');

describe('Scheduler', () => {
    describe('.runEvery', () => {
        afterEach(() => {
            Scheduler.clearIntervals();
        });

        it('runs things at the described interval', (done) => {
            let timesRun = 0;
            Scheduler.runEvery('3 milliseconds', () => {
                timesRun += 1;
            });

            setTimeout(() => {
                assert.closeTo(5, timesRun, 2);
                done();
            }, 15);
        });
    });

    describe('.unitToMultiplier', () => {
        it('has a milliseconds multiplier', () => {
            [Scheduler.unitToMultiplier('milliseconds'), Scheduler.unitToMultiplier('ms')].forEach(mult => assert.equal(mult, 1));
        });

        it('has a days multiplier', () => {
            [
                Scheduler.unitToMultiplier('day'),
                Scheduler.unitToMultiplier('days'),
                Scheduler.unitToMultiplier('Day'),
            ].forEach(mult => assert.equal(mult, 1000 * 60 * 60 * 24));
        });
    });
});
