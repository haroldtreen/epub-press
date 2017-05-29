'use strict';

const INTERVALS = {};
const UNITS = {
    ms: 1,
    milliseconds: 1,
    day: 1000 * 60 * 60 * 24,
    days: 1000 * 60 * 60 * 24,
};

class Scheduler {
    static unitToMultiplier(unit) {
        return UNITS[unit.toLowerCase()];
    }

    static clearIntervals() {
        Object.keys(INTERVALS).forEach((key) => {
            INTERVALS[key].forEach(clearInterval);
        });
    }

    static saveInterval(interval) {
        const savedIntervals = INTERVALS[interval] || [];
        savedIntervals.push(interval);

        INTERVALS[interval] = savedIntervals;
        return interval;
    }

    static parseInterval(interval) {
        const [val, unit] = interval.split(' ');
        const multiplier = this.unitToMultiplier(unit);

        return Number(val) * multiplier;
    }

    static runEvery(interval, cb) {
        const ms = this.parseInterval(interval);
        return this.saveInterval(setInterval(cb, ms));
    }
}

module.exports = Scheduler;
