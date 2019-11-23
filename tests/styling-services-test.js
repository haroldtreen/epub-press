const fs = require('fs-extra');
const glob = require('glob');

const Book = require('../lib/book');
const StylingService = require('../lib/styling-service');
const Utilities = require('../lib/utilities');

function assertDifferentFile(path1, path2) {
    expect(path1).not.toEqual(path2);
    expect(fs.pathExistsSync(path1)).toBe(true);
    expect(fs.pathExistsSync(path2)).toBe(true);
}

describe('StylingService', () => {
    afterAll(() => {
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
        }, 10000);
    });

    describe('.stringToLines', () => {
        it('returns no lines for an empty string', () => {
            const lines = StylingService.stringToLines('');
            expect(lines.length).toBe(0);
        });

        it('aligns single characters to the middle of the page', () => {
            const line = StylingService.stringToLines('a')[0];

            expect(line.x).toEqual(StylingService.MAX_X / 2 - StylingService.CHAR_WIDTH / 2);
            expect(line.y).toEqual(StylingService.MIN_Y);
            expect(line.content).toEqual('a');
        });

        it('aligns long words to the left margin', () => {
            const line = StylingService.stringToLines('a'.repeat(1000))[0];
            expect(line.x).toBeLessThanOrEqual(StylingService.MARGIN + StylingService.CHAR_WIDTH);
        });

        it('shortens lines to fit the width', () => {
            const line = StylingService.stringToLines('a'.repeat(100))[0];
            const lineLength = line.content.length * StylingService.CHAR_WIDTH;
            const rightMargin = StylingService.MAX_X - StylingService.MARGIN;

            expect(line.x + lineLength).toBeLessThanOrEqual(rightMargin);
        });

        it('wraps long text to the next line', () => {
            const lines = StylingService.stringToLines(`Hello ${'world'.repeat(30)}`);
            expect(lines[0].content).toEqual('Hello');
            expect(lines[0].x).toBeGreaterThan(StylingService.MARGIN);
            expect(lines[1].y - lines[0].y).toEqual(StylingService.LINE_HEIGHT);
        });

        it('accepts a maxLines option', () => {
            const maxLines = 2;
            const lines = StylingService.stringToLines('Hello '.repeat(40), { maxLines });

            expect(lines.length).toBe(maxLines);
            expect(lines[1].content.slice(-3)).toEqual('...');
        });
    });

    describe('.stringToLine', () => {
        it('returns the line and no extra for short lines', () => {
            const line = StylingService.stringToLine('Hello');

            expect(line.content).toEqual('Hello');
            expect(line.extra).toEqual('');
        });

        it('returns the line and the extra string for long lines', () => {
            const str = 'aaa '.repeat(100);
            const line = StylingService.stringToLine(str);
            const maxCharCount = StylingService.LINE_WIDTH / StylingService.CHAR_WIDTH;

            expect(line.content.length).toBeLessThanOrEqual(maxCharCount);
            expect(`${line.content} ${line.extra}`).toEqual(str);
        });
    });

    describe('.wordToLine', () => {
        it('leaves short words intact', () => {
            const line = StylingService.wordToLine('Hello');
            const margin = StylingService.MARGIN
                + (StylingService.LINE_WIDTH - StylingService.stringSize('Hello')) / 2;

            expect(line.content).toEqual('Hello');
            expect(line.extra).toEqual('');
            expect(line.x).toEqual(margin);
        });

        it('splits long words in half', () => {
            const word = 'Ha'.repeat(50);
            const line = StylingService.wordToLine(word);

            expect(line.content + line.extra).toEqual(word);
            expect(line.x).toBeGreaterThanOrEqual(StylingService.MARGIN);
        });
    });
});
