const { assert } = require('chai');

const fs = require('fs-extra');
const glob = require('glob');

const Book = require('../lib/book');
const StylingService = require('../lib/styling-service');
const Utilities = require('../lib/utilities');

function assertDifferentFile(path1, path2) {
    assert.notEqual(path1, path2);
    assert.isTrue(fs.pathExistsSync(path1));
    assert.isTrue(fs.pathExistsSync(path2));
}

describe('StylingService', () => {
    after(() => {
        glob(`${StylingService.COVERS_TMP}/*.jpg`, (err, files) => {
            Utilities.removeFiles(files);
        });
    });

    describe('.writeOnCover', () => {
        it('can add text to a book cover', () => {
            const book = new Book({
                title: 'Rachel is pretty sweellll as a bell!',
            });
            const preStyledCover = book.getCoverPath();
            return StylingService.writeOnCover(book, 'Hello World').then((updatedBook) => {
                const postStyledCover = updatedBook.getCoverPath();
                assertDifferentFile(preStyledCover, postStyledCover);
            });
        });
    });

    describe('.stringToLines', () => {
        it('returns no lines for an empty string', () => {
            const lines = StylingService.stringToLines('');
            assert.lengthOf(lines, 0);
        });

        it('aligns single characters to the middle of the page', () => {
            const line = StylingService.stringToLines('a')[0];

            assert.equal(line.x, StylingService.MAX_X / 2 - StylingService.CHAR_WIDTH / 2);
            assert.equal(line.y, StylingService.MIN_Y);
            assert.equal(line.content, 'a');
        });

        it('aligns long words to the left margin', () => {
            const line = StylingService.stringToLines('a'.repeat(1000))[0];
            assert.isAtMost(line.x, StylingService.MARGIN + StylingService.CHAR_WIDTH);
        });

        it('shortens lines to fit the width', () => {
            const line = StylingService.stringToLines('a'.repeat(100))[0];
            const lineLength = line.content.length * StylingService.CHAR_WIDTH;
            const rightMargin = StylingService.MAX_X - StylingService.MARGIN;

            assert.isAtMost(line.x + lineLength, rightMargin);
        });

        it('wraps long text to the next line', () => {
            const lines = StylingService.stringToLines(`Hello ${'world'.repeat(30)}`);
            assert.equal(lines[0].content, 'Hello');
            assert.isAbove(lines[0].x, StylingService.MARGIN);
            assert.equal(lines[1].y - lines[0].y, StylingService.LINE_HEIGHT);
        });

        it('accepts a maxLines option', () => {
            const maxLines = 2;
            const lines = StylingService.stringToLines('Hello '.repeat(40), { maxLines });

            assert.lengthOf(lines, maxLines);
            assert.equal(lines[1].content.slice(-3), '...');
        });
    });

    describe('.stringToLine', () => {
        it('returns the line and no extra for short lines', () => {
            const line = StylingService.stringToLine('Hello');

            assert.equal(line.content, 'Hello');
            assert.equal(line.extra, '');
        });

        it('returns the line and the extra string for long lines', () => {
            const str = 'aaa '.repeat(100);
            const line = StylingService.stringToLine(str);
            const maxCharCount = StylingService.LINE_WIDTH / StylingService.CHAR_WIDTH;

            assert.isAtMost(line.content.length, maxCharCount);
            assert.equal(`${line.content} ${line.extra}`, str);
        });
    });

    describe('.wordToLine', () => {
        it('leaves short words intact', () => {
            const line = StylingService.wordToLine('Hello');
            const margin =
                StylingService.MARGIN +
                (StylingService.LINE_WIDTH - StylingService.stringSize('Hello')) / 2;

            assert.equal(line.content, 'Hello');
            assert.equal(line.extra, '');
            assert.equal(line.x, margin);
        });

        it('splits long words in half', () => {
            const word = 'Ha'.repeat(50);
            const line = StylingService.wordToLine(word);

            assert.equal(line.content + line.extra, word);
            assert.isAtLeast(line.x, StylingService.MARGIN);
        });
    });
});
