const AppErrors = require('../../lib/app-errors');

function normalizeRequest(req) {
    // Previously used to force a filetype for kindle.
    return req;
}

class RequestValidators {
    static validatePublishRequest(req) {
        return new Promise((resolve, reject) => {
            if (!req.body.urls && !req.body.sections) {
                reject(AppErrors.getApiError('NO_SECTIONS_SPECIFIED'));
            } else if ((req.body.urls || []).length >= this.MAX_NUM_SECTIONS) {
                reject(AppErrors.getApiError('TOO_MANY_ITEMS'));
            } else if ((req.body.sections || []).length >= this.MAX_NUM_SECTIONS) {
                reject(AppErrors.getApiError('TOO_MANY_ITEMS'));
            } else {
                resolve(req);
            }
        });
    }

    static validateEmailRequest(req) {
        return new Promise((resolve, reject) => {
            if (!req.query.email) {
                reject(AppErrors.getApiError('NO_EMAIL_SPECIFIED'));
            } else {
                const normalizedRequest = normalizeRequest(req);
                resolve(normalizedRequest);
            }
        });
    }
}

if (process.env.MAX_NUM_SECTIONS) {
    RequestValidators.MAX_NUM_SECTIONS = process.env.MAX_NUM_SECTIONS;
} else {
    RequestValidators.MAX_NUM_SECTIONS = 50;
}

module.exports = RequestValidators;
