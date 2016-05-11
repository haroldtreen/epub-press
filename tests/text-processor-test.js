'use strict';

const assert = require('chai').assert;
const TextProcessor = require('../lib/text-processor');

describe('Text Processor', () => {
    it('can remove indents', () => {
        const text = ['  hello', '    world'].join('\n');
        const expected = ['hello', '  world'].join('\n');

        assert.equal(TextProcessor.removeIndent(text), expected);
    });
});
