'use strict';

const Logger = require('./logger.js');

const log = new Logger();

class ResultsValidator {
    constructor(section) {
        this.preHtml = section.html;
        this.postHtml = section.content;
        this.url = section.url;
    }

    lengthValidation() {
        const percent = 100 * (this.postHtml.length / this.preHtml.length);
        if (percent <= ResultsValidator.LENGTH_THRESHOLD) {
            log.warn(`Remaining content ${percent}%`, { url: this.url });
            return false;
        }
        return true;
    }

    paragraphCountValidation() {
        const preParas = this.preHtml.match(/<\/p>/gi) || [];
        const postParas = this.postHtml.match(/<\/p>/gi) || [];

        const percent = 100 * (postParas.length / preParas.length);
        if (percent <= ResultsValidator.PARAGRAPH_THRESHOLD) {
            log.warn(`Remaining paragraphs ${percent}%`, { url: this.url });
            return false;
        }
        return true;
    }

    validate() {
        let totalResult = true;
        ResultsValidator.VALIDATORS.forEach((validator) => {
            const result = this[validator](this.preHtml, this.postHtml);
            totalResult = totalResult && result;
        });
        return totalResult;
    }
}

ResultsValidator.VALIDATORS = ['lengthValidation', 'paragraphCountValidation'];
ResultsValidator.LENGTH_THRESHOLD = 2.5;
ResultsValidator.PARAGRAPH_THRESHOLD = 15;

module.exports = ResultsValidator;
