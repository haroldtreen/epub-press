const Scheduler = require('../lib/scheduler');

describe('Scheduler', () => {
    describe('.runEvery', () => {
        afterEach(() => {
            Scheduler.clearIntervals();
        });

        it('runs things at the described interval', (done) => {
            let timesRun = 0;
            Scheduler.runEvery('5 milliseconds', () => {
                timesRun += 1;
            });

            setTimeout(() => {
                expect(timesRun).toBeLessThanOrEqual(3);
                done();
            }, 15);
        });
    });

    describe('.unitToMultiplier', () => {
        it('has a milliseconds multiplier', () => {
            [Scheduler.unitToMultiplier('milliseconds'), Scheduler.unitToMultiplier('ms')].forEach(
                mult => expect(mult).toEqual(1)
            );
        });

        it('has a days multiplier', () => {
            [
                Scheduler.unitToMultiplier('day'),
                Scheduler.unitToMultiplier('days'),
                Scheduler.unitToMultiplier('Day'),
            ].forEach(mult => expect(mult).toEqual(1000 * 60 * 60 * 24));
        });
    });
});
