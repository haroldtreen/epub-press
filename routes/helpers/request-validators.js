const _ = require('lodash');
const AppErrors = require('../../lib/app-errors');

function getAttribute(body, attributeName) {
    return _.get(body, ['data', 'attributes', attributeName]);
}

function isType(body, type) {
    return _.get(body, 'data.type') === type;
}

class RequestValidators {
    static validatePublishRequest(req) {
        return new Promise((resolve, reject) => {
            if (!req.body.urls && !req.body.sections) {
                reject(AppErrors.getApiError('NO_SECTIONS_SPECIFIED'));
            } else if ((req.body.urls || []).length >= this.MAX_NUM_SECTIONS) {
                reject(AppErrors.getApiError('TOO_MANY_ITEMS'));
            } else if ((req.body.sections || []).length >= this.MAX_NUM_SECTIONS) {
                reject(AppErrors.getApiError('TOO_MANY_ITEMS'))
            } else {
                resolve(req);
            }
        });
    }
}

RequestValidators.MAX_NUM_SECTIONS = 50;


module.exports = RequestValidators;
