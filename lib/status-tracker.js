function limitStatuses(tracker) {
    if (tracker.keys.length < StatusTracker.MAX_STATUSES) {
        return;
    }

    tracker.clearStatus(tracker.keys.shift());
}

class StatusTracker {
    constructor() {
        this.statuses = {};
        this.keys = [];
    }

    reset() {
        this.statuses = {};
        this.keys = [];
    }

    setStatus(id, status) {
        this.statuses[id] = status;
        if (this.keys.indexOf(id) < 0) {
            this.keys.push(id);
        }
        limitStatuses(this);
    }

    getStatus(id) {
        return this.statuses[id];
    }

    clearStatus(id) {
        delete this.statuses[id];
    }
}

StatusTracker.MAX_STATUSES = 100;

module.exports = StatusTracker;
