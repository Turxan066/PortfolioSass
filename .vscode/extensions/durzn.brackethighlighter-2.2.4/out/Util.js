"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSymbolFromPosition_legacy = exports.getSymbolFromPosition = exports.SymbolWithOffset = exports.SymbolType = void 0;
const vscode = require("vscode");
const SymbolHandler = require("./SymbolHandler");
const GlobalsHandler_1 = require("./GlobalsHandler");
const SymbolFinder_1 = require("./SymbolFinder");
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["STARTSYMBOL"] = 0] = "STARTSYMBOL";
    SymbolType[SymbolType["ENDSYMBOL"] = 1] = "ENDSYMBOL";
    SymbolType[SymbolType["ALLSYMBOLS"] = 2] = "ALLSYMBOLS";
})(SymbolType = exports.SymbolType || (exports.SymbolType = {}));
class SymbolWithOffset {
    constructor(symbol, absoluteOffset, relativeOffset) {
        this.symbol = symbol;
        this.absoluteOffset = absoluteOffset;
        this.relativeOffset = relativeOffset;
    }
}
exports.SymbolWithOffset = SymbolWithOffset;
function getClosestSymbolFromPosition(symbols, cursorPosition) {
    if (symbols.length === 0) {
        return { symbol: "", relativeOffset: 0, absoluteOffset: 0 };
    }
    else if (symbols.length === 1) {
        return symbols[0];
    }
    let closestSymbol = symbols.reduce((symbol1, symbol2) => {
        if (symbol1.absoluteOffset <= cursorPosition && symbol1.absoluteOffset + symbol1.symbol.length > cursorPosition) {
            return symbol1;
        }
        else if (symbol2.absoluteOffset <= cursorPosition && symbol2.absoluteOffset + symbol2.symbol.length > cursorPosition) {
            return symbol2;
        }
        else {
            let res1 = Math.abs(symbol1.absoluteOffset - cursorPosition);
            let res2 = Math.abs(symbol2.absoluteOffset - cursorPosition);
            return res1 <= res2 ? symbol1 : symbol2;
        }
    });
    return closestSymbol;
}
function getSymbols(symbolType) {
    let validSymbols = [];
    let startSymbols = GlobalsHandler_1.bracketHighlightGlobals.allowedStartSymbols;
    let endSymbols = GlobalsHandler_1.bracketHighlightGlobals.allowedEndSymbols;
    switch (symbolType) {
        case SymbolType.STARTSYMBOL:
            validSymbols = startSymbols;
            break;
        case SymbolType.ENDSYMBOL:
            validSymbols = endSymbols;
            break;
        default:
            validSymbols = startSymbols.concat(endSymbols);
            break;
    }
    return validSymbols;
}
/******************************************************************************************************************************************
* Gets a valid start symbol and its offset from the given selection. Returns "" if no symbol is found.
*	activeEditor: Editor containing the selectionStart
*	selectionStart: Where searching for symbols shall start
*	symbolType: Which symbols to include in the search
******************************************************************************************************************************************/
function getSymbolFromPosition(activeEditor, selectionStart, symbolType) {
    let lineText = activeEditor.document.lineAt(selectionStart.line).text;
    let foundSymbols = [];
    let cursorPosition = selectionStart.character;
    let validSymbols = getSymbols(symbolType);
    for (let validSymbol of validSymbols) {
        let isRegExSymbol = false;
        if (isRegExSymbol) {
            /* TODO: Regex implementation */
        }
        else {
            /* Current problem with this implementation: Substrings are considered a match as well, which breaks the old behavior
            => Would need to use a regex with \b*string*\b, which does not work. Find out why. */
            let symbolOffsets = new SymbolFinder_1.default().findIndicesOfSymbol(lineText, validSymbol);
            for (let offset of symbolOffsets) {
                foundSymbols.push({ symbol: validSymbol, absoluteOffset: offset, relativeOffset: offset - cursorPosition });
            }
        }
    }
    let closestSymbol = getClosestSymbolFromPosition(foundSymbols, cursorPosition);
    if (closestSymbol.symbol !== "") {
        if (cursorPosition > (closestSymbol.absoluteOffset - 1) && cursorPosition <= (closestSymbol.absoluteOffset + closestSymbol.symbol.length)) {
            return closestSymbol;
        }
    }
    return new SymbolWithOffset("", 0, 0);
}
exports.getSymbolFromPosition = getSymbolFromPosition;
/******************************************************************************************************************************************
* Gets a valid start symbol and its offset from the given selection. Returns "" if no symbol is found.
*	activeEditor: Editor containting the selectionStart
*	selectionStart: Where searching for symbols shall start
*	functionCount: Number specifying how often the function has been called (used to find symbols around the selectionStart)
******************************************************************************************************************************************/
function getSymbolFromPosition_legacy(activeEditor, selectionStart, symbolType, functionCount) {
    const maxFunctionCount = 2;
    if (functionCount >= maxFunctionCount) {
        return { symbol: "", offset: 0 };
    }
    let symbolHandler = new SymbolHandler.SymbolHandler();
    let symbolFinder = new SymbolFinder_1.default;
    let validSymbols = [];
    switch (symbolType) {
        case SymbolType.STARTSYMBOL:
            validSymbols = symbolHandler.getValidStartSymbols();
            break;
        case SymbolType.ENDSYMBOL:
            validSymbols = symbolHandler.getValidEndSymbols();
            break;
        case SymbolType.ALLSYMBOLS:
            validSymbols = symbolHandler.getValidStartSymbols().concat(symbolHandler.getValidEndSymbols());
            break;
    }
    let longestSymbolLength = validSymbols.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
    let startPosition = new vscode.Position(selectionStart.line, 0);
    let endPosition = new vscode.Position(selectionStart.line, selectionStart.character + longestSymbolLength);
    let selectionLineText = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
    let stringPosition = selectionStart.character;
    let selectionSymbol = selectionLineText[stringPosition];
    const containsSymbol = (symbol) => symbol.indexOf(selectionSymbol) !== -1;
    validSymbols = validSymbols.filter(containsSymbol);
    let tempValidSymbols = validSymbols;
    while (validSymbols.some(containsSymbol)) {
        if (stringPosition === 0) {
            selectionSymbol = " " + selectionSymbol;
            break;
        }
        else {
            stringPosition--;
        }
        selectionSymbol = selectionLineText[stringPosition] + selectionSymbol;
        tempValidSymbols = tempValidSymbols.filter(containsSymbol);
        if (tempValidSymbols.length !== 0) {
            validSymbols = validSymbols.filter(containsSymbol);
        }
    }
    if (selectionSymbol === undefined) {
        if (selectionStart.character === 0) {
            return { symbol: "", offset: 0 };
        }
        return getSymbolFromPosition_legacy(activeEditor, selectionStart.translate(0, -1), symbolType, functionCount + 1);
    }
    if (GlobalsHandler_1.bracketHighlightGlobals.regexMode && symbolFinder.isSymbolEscaped(selectionSymbol)) {
        return { symbol: "", offset: 0 };
    }
    selectionSymbol = selectionSymbol.substr(1, selectionSymbol.length - 1);
    stringPosition = selectionStart.character;
    while (validSymbols.some(containsSymbol) && selectionSymbol !== "") {
        stringPosition++;
        if (selectionLineText[stringPosition] === undefined) {
            selectionSymbol = selectionSymbol + " ";
            break;
        }
        selectionSymbol = selectionSymbol + selectionLineText[stringPosition];
        tempValidSymbols = tempValidSymbols.filter(containsSymbol);
        if (tempValidSymbols.length !== 0) {
            validSymbols = validSymbols.filter(containsSymbol);
        }
    }
    selectionSymbol = selectionSymbol.substr(0, selectionSymbol.length - 1);
    let symbol = selectionSymbol;
    if (symbolHandler.isValidStartSymbol(symbol) || symbolHandler.isValidEndSymbol(symbol)) {
        return { symbol: symbol, offset: -functionCount };
    }
    else {
        if (selectionStart.character === 0) {
            return { symbol: "", offset: 0 };
        }
        return getSymbolFromPosition_legacy(activeEditor, selectionStart.translate(0, -1), symbolType, functionCount + 1);
    }
}
exports.getSymbolFromPosition_legacy = getSymbolFromPosition_legacy;
//# sourceMappingURL=Util.js.map