const Jimp = require('jimp');
const path = require('path');
const Config = require('./config');

function postProcessLines(lines, options) {
    if (options.maxLines === 0) {
        const lastLine = lines[lines.length - 1];
        lastLine.content = lastLine.content.replace(/.{3}$/, '...');
    }
    return lines;
}

class StylingService {
    static getOutputPath(filename) {
        return path.join(StylingService.COVERS_TMP, filename);
    }

    static getTempFilename(book) {
        return `${book.getId()}.png`;
    }

    static stringSize(str) {
        return str.length * StylingService.CHAR_WIDTH;
    }

    static calculateMargin(str) {
        const extraSpace = (StylingService.LINE_WIDTH - StylingService.stringSize(str)) / 2;
        return StylingService.MARGIN + Math.max(0, extraSpace);
    }

    static wordToLine(word) {
        let i;
        let size;

        for (i = 0; i <= word.length; i += 1) {
            const substr = word.slice(0, i);
            size = StylingService.stringSize(substr);
            if (size > StylingService.LINE_WIDTH) {
                break;
            }
        }

        const content = word.slice(0, i - 1);
        return {
            content,
            extra: word.slice(i - 1, word.length),
            x: StylingService.calculateMargin(content),
        };
    }

    static stringToLine(str) {
        const words = str.split(' ');
        const line = StylingService.wordToLine(words[0]);

        if (line.extra && words.length > 1) {
            words.unshift(line.extra);
            line.extra = words.join(' ');
            return line;
        }

        for (let i = 1; i < words.length; i += 1) {
            const newContent = `${line.content} ${words[i]}`;
            if (StylingService.stringSize(newContent) > StylingService.LINE_WIDTH) {
                const extraWords = words.slice(i, words.length);
                line.extra = extraWords.join(' ');
                return line;
            }
            line.content = newContent;
        }

        return line;
    }

    static stringToLines(str, options = {}) {
        if (!str) return [];
        if (options.maxLines === 0) return [];

        // eslint-disable-next-line
        options.maxLines = options.maxLines && options.maxLines - 1;

        const line = StylingService.stringToLine(str);
        const lines = [line]
            .concat(StylingService.stringToLines(line.extra, options))
            .map((l, i) => ({
                content: l.content,
                x: StylingService.calculateMargin(l.content),
                y: StylingService.MIN_Y + StylingService.LINE_HEIGHT * i,
            }));

        return postProcessLines(lines, options);
    }

    static writeOnCover(book, coverText) {
        return new Promise(resolve =>
            Jimp.loadFont(StylingService.FONT_PATH).then(font =>
                Jimp.read(book.getCoverPath()).then((cover) => {
                    const newCoverFilename = this.getTempFilename(book);
                    const newCoverPath = this.getOutputPath(newCoverFilename);
                    book.setCoverPath(newCoverPath);
                    const lines = StylingService.stringToLines(coverText, {
                        maxLines: StylingService.MAX_LINES,
                    });
                    lines.forEach((line) => {
                        cover.print(font, line.x, line.y, line.content);
                    });
                    cover.write(newCoverPath, () => resolve(book));
                }))).catch(e => e);
    }
}

StylingService.COVERS_TMP = Config.COVERS_TMP;
StylingService.FONT_PATH = `${Config.ASSETS_PATH}/opensans_64.fnt`;
StylingService.MAX_X = 816;
StylingService.MIN_Y = 770;
StylingService.MARGIN = 50;
StylingService.LINE_WIDTH = StylingService.MAX_X - StylingService.MARGIN * 2;
StylingService.LINE_HEIGHT = 80;
StylingService.MAX_LINES = 3;
StylingService.CHAR_WIDTH = 30;

module.exports = StylingService;
