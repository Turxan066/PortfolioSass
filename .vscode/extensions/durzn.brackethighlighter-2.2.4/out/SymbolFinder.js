"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolFinder = void 0;
const vscode = require("vscode");
const SymbolHandler = require("./SymbolHandler");
const GlobalsHandler_1 = require("./GlobalsHandler");
class SymbolFinder {
    constructor() {
        this.depth = 0;
        this.lineCounter = 0;
    }
    getFirstLetterPosition(startPosition, textLine) {
        let regExp = /[^\s]*[\S]+/g;
        let lineOffset = textLine.search(regExp);
        if (lineOffset > 0) {
            return startPosition.with(startPosition.line, lineOffset);
        }
        return startPosition;
    }
    findIndicesOfSymbol(text, symbol) {
        if (symbol === "") {
            return [-1];
        }
        let regexMode = GlobalsHandler_1.bracketHighlightGlobals.regexMode;
        let indices = [];
        let startIndex = 0;
        let index = text.indexOf(symbol, startIndex);
        while (index !== -1) {
            if (regexMode) {
                /* If it's the first symbol, it cannot be escaped */
                if (index === 0) {
                    indices.push(index);
                }
                else if (text.charAt(index - 1) !== "\\") {
                    indices.push(index);
                }
            }
            else {
                indices.push(index);
            }
            startIndex++;
            index = text.indexOf(symbol, startIndex);
        }
        /* remove duplicates */
        indices = indices.filter(function (item, pos) {
            return indices.indexOf(item) === pos;
        });
        return indices;
    }
    iterateLinesForward(textLines, validSymbols, counterPartSymbol, counterPartSymbols, startPosition, depthCounter) {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove = 1;
        let maxLineCount = GlobalsHandler_1.bracketHighlightGlobals.maxLineSearchCount;
        let currentTextLineCount = 0;
        for (let textLine of textLines) {
            currentTextLineCount++;
            if (currentTextLineCount > maxLineCount) {
                return [];
            }
            tempPosition = this.getFirstLetterPosition(tempPosition, textLine);
            let endPosition = this.handleLineForward(textLine, validSymbols, counterPartSymbols, tempPosition, depthCounter);
            if (this.depth === depthCounter) {
                if (endPosition.character === 0) {
                    lineMove = 0;
                }
                ranges.push(new vscode.Range(tempPosition, endPosition.translate(0, counterPartSymbol.length)));
                return ranges;
            }
            ranges.push(new vscode.Range(tempPosition, endPosition));
            tempPosition = tempPosition.with(tempPosition.line + lineMove, 0);
            this.lineCounter++;
        }
        return [];
    }
    iterateLinesBackward(textLines, validSymbols, counterPartSymbols, startPosition, depthCounter) {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove = -1;
        let maxLineCount = GlobalsHandler_1.bracketHighlightGlobals.maxLineSearchCount;
        let currentTextLineCount = 0;
        for (let textLine of textLines) {
            currentTextLineCount++;
            if (currentTextLineCount > maxLineCount) {
                return [];
            }
            tempPosition = tempPosition.with(tempPosition.line, textLine.length);
            let endPosition = this.handleLineBackward(textLine, validSymbols, counterPartSymbols, tempPosition, depthCounter);
            if (this.depth === depthCounter) {
                ranges.push(new vscode.Range(tempPosition, endPosition));
                return ranges;
            }
            endPosition = this.getFirstLetterPosition(endPosition, textLine);
            ranges.push(new vscode.Range(tempPosition, endPosition));
            if (tempPosition.line + lineMove < 0) {
                lineMove = 0;
            }
            tempPosition = tempPosition.with(tempPosition.line + lineMove, tempPosition.character);
        }
        return [];
    }
    handleLineBackward(textLine, validSymbols, counterPartSymbols, startPosition, depthCounter) {
        let startIndices = [];
        for (let validSymbol of validSymbols) {
            startIndices = startIndices.concat(this.findIndicesOfSymbol(textLine, validSymbol));
        }
        let counterPartIndices = [];
        for (let counterPartSymbol of counterPartSymbols) {
            counterPartIndices = counterPartIndices.concat(this.findIndicesOfSymbol(textLine, counterPartSymbol));
        }
        let allIndices = startIndices.concat(counterPartIndices);
        allIndices = allIndices.sort(function (a, b) { return b - a; });
        for (let index of allIndices) {
            if (startIndices.includes(index)) {
                this.depth++;
            }
            else {
                this.depth--;
            }
            if (this.depth === depthCounter) {
                return startPosition.with(startPosition.line, index);
            }
        }
        let characterOffset = textLine.length;
        if (characterOffset > startPosition.character) {
            characterOffset = startPosition.character;
        }
        characterOffset = -characterOffset;
        return startPosition.translate(0, characterOffset);
    }
    isSymbolEscaped(symbol) {
        if (symbol.length > 0 && symbol.charAt(0) === "\\") {
            return true;
        }
        return false;
    }
    handleLineForward(textLine, validSymbols, counterPartSymbols, startPosition, depthCounter) {
        let startIndices = [];
        for (let validSymbol of validSymbols) {
            startIndices = startIndices.concat(this.findIndicesOfSymbol(textLine, validSymbol));
        }
        let counterPartIndices = [];
        for (let counterPartSymbol of counterPartSymbols) {
            counterPartIndices = counterPartIndices.concat(this.findIndicesOfSymbol(textLine, counterPartSymbol));
        }
        let allIndices = startIndices.concat(counterPartIndices);
        allIndices = allIndices.sort(function (a, b) { return a - b; });
        for (let index of allIndices) {
            if (startIndices.includes(index)) {
                this.depth++;
            }
            else {
                this.depth--;
                if (this.depth === depthCounter) {
                    if (this.lineCounter === 0) {
                        return startPosition.translate(0, index);
                    }
                    return startPosition.with(startPosition.line, index);
                }
            }
        }
        let characterOffset = textLine.length;
        return startPosition.translate(0, characterOffset);
    }
    findForwards(activeEditor, validSymbols, counterPartSymbol, counterPartSymbols, startPosition, depthCounter) {
        let endPosition = activeEditor.document.positionAt(activeEditor.document.getText().length);
        let textRange = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        return this.iterateLinesForward(textLines, validSymbols, counterPartSymbol, counterPartSymbols, startPosition, depthCounter);
    }
    findBackwards(activeEditor, validSymbols, counterPartSymbols, startPosition, depthCounter) {
        let endPosition = activeEditor.document.positionAt(0);
        let textRange = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        textLines = textLines.reverse();
        return this.iterateLinesBackward(textLines, validSymbols, counterPartSymbols, startPosition, depthCounter);
    }
    findMatchingSymbolPosition(activeEditor, validSymbol, validSymbols, counterPartSymbol, counterPartSymbols, startPosition) {
        let symbolHandler = new SymbolHandler.SymbolHandler();
        this.depth = 0;
        if (symbolHandler.isValidStartSymbol(validSymbol) === true) {
            return this.findForwards(activeEditor, validSymbols, counterPartSymbol, counterPartSymbols, startPosition, 0);
        }
        else if (symbolHandler.isValidEndSymbol(validSymbol) === true) {
            return this.findBackwards(activeEditor, validSymbols, counterPartSymbols, startPosition, 0);
        }
        return [];
    }
    findDepth1Backwards(activeEditor, startPosition, textLines, symbols, counterPartSymbols) {
        textLines = textLines.reverse();
        let textRanges = [];
        let foundSymbols = [];
        let symbolHandler = new SymbolHandler.SymbolHandler();
        for (let startSymbol of symbols) {
            let counterPartSymbols = symbolHandler.getCounterParts(startSymbol);
            let possibleRange = this.findBackwards(activeEditor, [startSymbol], counterPartSymbols, startPosition, 1);
            if (possibleRange.length <= 0) {
                continue;
            }
            let rangeText = activeEditor.document.getText(possibleRange[possibleRange.length - 1]);
            if (rangeText.includes(startSymbol)) {
                textRanges.push(possibleRange);
                foundSymbols.push(startSymbol);
            }
            this.depth = 0;
        }
        let possibleRanges = [];
        for (let i = 0; i < textRanges.length; i++) {
            let textRange = textRanges[i];
            if (textRange.length === 0) {
                continue;
            }
            let textRangeLine = textRanges[i][textRanges[i].length - 1].start.line;
            let textRangeCharacter = textRanges[i][textRanges[i].length - 1].start.character;
            possibleRanges.push({ symbol: foundSymbols[i], symbolPosition: new vscode.Position(textRangeLine, textRangeCharacter) });
        }
        return possibleRanges.sort((a, b) => { return a.symbolPosition.isBefore(b.symbolPosition) === true ? 1 : -1; });
    }
}
exports.default = SymbolFinder;
exports.SymbolFinder = SymbolFinder;
//# sourceMappingURL=SymbolFinder.js.map