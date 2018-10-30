'use strict';

class TextProcessor {
    static isIndented(lines) {
        let linesIndented;
        const lineIndented = (line) => {
            let hasIndent = line;
            if (typeof line === 'string') {
                hasIndent = /\s/.test(line.charAt(0)) || line.length === 0;
            }
            return hasIndent;
        };

        if (lines.length > 1) {
            linesIndented = lines.reduce(
                (left, right) => lineIndented(left) && lineIndented(right)
            );
        } else {
            linesIndented = lineIndented(lines[0]);
        }

        return linesIndented;
    }

    static decreaseIndent(lines) {
        return lines.map((line) => {
            let decreasedLine = line;
            if (/\s/.test(line.charAt(0)) && line.length > 0) {
                decreasedLine = line.substring(1, line.length);
            }
            return decreasedLine;
        });
    }

    static removeIndent(text) {
        let lines = text.split('\n');
        while (TextProcessor.isIndented(lines)) {
            lines = TextProcessor.decreaseIndent(lines);
        }
        return lines.join('\n');
    }
}

module.exports = TextProcessor;
