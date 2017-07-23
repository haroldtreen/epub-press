const Jimp = require('jimp');
const Config = require('./config');
const path = require('path');

const fontPath = '/Users/haroldtreen/code/web/epub-press/lib/font.fnt';

class StylingService {
    static getOutputPath(filename) {
        return path.join(StylingService.COVERS_TMP, filename);
    }

    static getTempFilename(book) {
        const extname = path.extname(book.getCoverPath());
        return `${book.getId()}${extname}`;
    }

    static writeOnCover(book) {
        return new Promise(resolve =>
            Jimp.loadFont(StylingService.FONT_PATH).then(font =>
                Jimp.read(book.getCoverPath()).then((cover) => {
                    const newCoverFilename = this.getTempFilename(book);
                    const newCoverPath = this.getOutputPath(newCoverFilename);
                    book.setCoverPath(newCoverPath);
                    cover
                        .print(font, 200, 800, book.getTitle())
                        .write(newCoverPath, () => resolve(book));
                })
            )
        ).catch(e => e);
    }
}

StylingService.COVERS_TMP = Config.COVERS_TMP;
StylingService.FONT_PATH = `${Config.ASSETS_PATH}/font.fnt`;

module.exports = StylingService;
