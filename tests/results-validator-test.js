const assert = require('chai').assert;
const sinon = require('sinon');

const ResultsValidator = require('../lib/results-validator.js');

function makeHtml(numLines) {
    return [
        '<html><body>',
        new Array(numLines).join('<p>Hello World</p>'),
        '</body></html>',
    ].join('\n');
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
        assert.isFalse(badValidator.lengthValidation());
        assert.isTrue(goodValidator.lengthValidation());
    });

    it('checks paragraph variations', () => {
        assert.isFalse(badValidator.paragraphCountValidation());
        assert.isTrue(goodValidator.paragraphCountValidation());
    });

    it('can validate using all validators', () => {
        ResultsValidator.VALIDATORS.forEach((validator) => {
            sinon.spy(goodValidator, validator);
        });

        assert.isTrue(goodValidator.validate());

        ResultsValidator.VALIDATORS.forEach((validator) => {
            assert.isTrue(goodValidator[validator].calledOnce);
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
            assert.include(ResultsValidator.VALIDATORS.concat(IGNORE), property);
        });
    });
});
