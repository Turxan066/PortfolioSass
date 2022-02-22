"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Highlighter = void 0;
class Highlighter {
    highlightRange(editor, decorationType, range) {
        const decorationOptions = [];
        const decoration = { range };
        decorationOptions.push(decoration);
        editor.setDecorations(decorationType, decorationOptions);
    }
    highlightRanges(editor, decorationHandler, ranges) {
        let decorationTypes = [];
        for (let range of ranges) {
            let decorationType = decorationHandler.getDecorationType();
            decorationTypes.push(decorationType);
            this.highlightRange(editor, decorationType, range);
        }
        return decorationTypes;
    }
    removeHighlight(decorationType) {
        decorationType.dispose();
    }
    removeHighlights(decorationTypes) {
        for (let decorationType of decorationTypes) {
            this.removeHighlight(decorationType);
        }
    }
}
exports.default = Highlighter;
exports.Highlighter = Highlighter;
//# sourceMappingURL=Highlighter.js.map