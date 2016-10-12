function limitStatuses(tracker) {
    if (tracker.keys.length < StatusTracker.MAX_STATUSES) {
        return;
    }

    tracker.clearStatus(tracker.keys.shift());
}

class StatusTracker {

    static buildStatus(statusType) {
        return StatusTracker.STATUSES[statusType] || StatusTracker.STATUSES.DEFAULT;
    }

    constructor() {
        this.statuses = {};
        this.keys = [];
    }

    reset() {
        this.statuses = {};
        this.keys = [];
    }

    setStatus(id, statusType) {
        this.statuses[id] = StatusTracker.buildStatus(statusType);
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
StatusTracker.STATUSES = {
    DEFAULT: { message: 'Unknown Status', progress: 0 },
    PUBLISHING: { message: 'Publishing...', progress: 5 },
    FETCHING_HTML: { message: 'Fetching HTML...', progress: 10 },
    EXTRACTING_CONTENT: { message: 'Extracting Content...', progress: 30 },
    FETCHING_IMAGES: { message: 'Fetching Images...', progress: 70 },
    FORMATTING_HTML: { message: 'Formatting HTML...', progress: 80 },
    WRITTING_EBOOK: { message: 'Writting Ebook...', progress: 90 },
    DONE: { message: 'Done!', progress: 100 },
};

module.exports = StatusTracker;
