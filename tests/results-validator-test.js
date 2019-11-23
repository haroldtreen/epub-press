const sinon = require('sinon');

const ResultsValidator = require('../lib/results-validator.js');

function makeHtml(numLines) {
    return ['<html><body>', new Array(numLines).join('<p>Hello World</p>'), '</body></html>'].join(
        '\n'
    );
}

const goodSection = {
    url: 'http://good.com/',
    html: makeHtml(100),
    content: makeHtml(70),
};
const badSection = {
    url: 'http://bad.com/',
    html: makeHtml(100),
    content: makeHtml(1),
};

const goodValidator = new ResultsValidator(goodSection);
const badValidator = new ResultsValidator(badSection);

describe('Results validator', () => {
    it('checks length variations', () => {
        expect(badValidator.lengthValidation()).toBe(false);
        expect(goodValidator.lengthValidation()).toBe(true);
    });

    it('checks paragraph variations', () => {
        expect(badValidator.paragraphCountValidation()).toBe(false);
        expect(goodValidator.paragraphCountValidation()).toBe(true);
    });

    it('can validate using all validators', () => {
        ResultsValidator.VALIDATORS.forEach((validator) => {
            sinon.spy(goodValidator, validator);
        });

        expect(goodValidator.validate()).toBe(true);

        ResultsValidator.VALIDATORS.forEach((validator) => {
            expect(goodValidator[validator].calledOnce).toBe(true);
            goodValidator[validator].restore();
        });
    });

    it('has an array of validators', () => {
        const IGNORE = [
            'name',
            'length',
            'prototype',
            'validate',
            'VALIDATORS',
            'LENGTH_THRESHOLD',
            'PARAGRAPH_THRESHOLD',
        ];
        Object.getOwnPropertyNames(ResultsValidator).forEach((property) => {
            expect(ResultsValidator.VALIDATORS.concat(IGNORE)).toContain(property);
        });
    });
});
