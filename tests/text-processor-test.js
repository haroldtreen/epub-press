'use strict';

const TextProcessor = require('../lib/text-processor');

describe('Text Processor', () => {
    it('can remove indents', () => {
        const text = ['  hello', '    world'].join('\n');
        const expected = ['hello', '  world'].join('\n');

        expect(TextProcessor.removeIndent(text)).toEqual(expected);
    });
});
