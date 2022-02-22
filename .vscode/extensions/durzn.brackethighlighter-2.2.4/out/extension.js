"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Highlighter = require("./Highlighter");
const DecorationHandler = require("./DecorationHandler");
const GlobalsHandler_1 = require("./GlobalsHandler");
const GlobalsHandler_2 = require("./GlobalsHandler");
const SymbolFinder = require("./SymbolFinder");
const SymbolHandler = require("./SymbolHandler");
const ActionHandler_1 = require("./ActionHandler");
const Util = require("./Util");
function activate(context) {
    let actionHandler = new ActionHandler_1.default();
    let onToggleExtensionStatusDisposable = vscode.commands.registerCommand('BracketHighlighter.toggleExtensionStatus', () => {
        actionHandler.onActivateHotkey();
        removePreviousDecorations();
    });
    let onJumpOutOfOpeningSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpOutOfOpeningSymbol', () => {
        actionHandler.onJumpOutOfOpeningSymbolHotkey();
    });
    let onJumpOutOfClosingSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpOutOfClosingSymbol', () => {
        actionHandler.onJumpOutOfClosingSymbolHotkey();
    });
    let onJumpToOpeningSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpToOpeningSymbol', () => {
        actionHandler.onJumpToOpeningSymbolHotkey();
    });
    let onJumpToClosingSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpToClosingSymbol', () => {
        actionHandler.onJumpToClosingSymbolHotkey();
    });
    let onSelectTextBetweenSymbols = vscode.commands.registerCommand('BracketHighlighter.selectTextInSymbols', () => {
        actionHandler.onSelectTextBetweenSymbolsHotkey();
    });
    vscode.workspace.onDidChangeConfiguration(handleConfigChangeEvent);
    vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
    context.subscriptions.push(onToggleExtensionStatusDisposable);
    context.subscriptions.push(onJumpOutOfOpeningSymbolDisposable);
    context.subscriptions.push(onJumpOutOfClosingSymbolDisposable);
    context.subscriptions.push(onJumpToOpeningSymbolDisposable);
    context.subscriptions.push(onJumpToClosingSymbolDisposable);
    context.subscriptions.push(onSelectTextBetweenSymbols);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
/******************************************************************************************************************************************
* Handles the config change event
******************************************************************************************************************************************/
function handleConfigChangeEvent() {
    GlobalsHandler_1.bracketHighlightGlobals.onConfigChange();
    removePreviousDecorations();
}
/******************************************************************************************************************************************
* Handles the text selection event
******************************************************************************************************************************************/
function handleTextSelectionEvent() {
    /******************************************* Early abort reasons **********************************************************************/
    if (GlobalsHandler_1.bracketHighlightGlobals.extensionEnabled === false) {
        return;
    }
    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor === undefined || !activeEditor) {
        return;
    }
    let debugMode = vscode.debug.activeDebugSession;
    if (debugMode !== undefined && GlobalsHandler_1.bracketHighlightGlobals.activeWhenDebugging === false) {
        removePreviousDecorations();
        return;
    }
    if (GlobalsHandler_1.bracketHighlightGlobals.enabledLanguages.length === 1 && GlobalsHandler_1.bracketHighlightGlobals.enabledLanguages.includes("")) {
    }
    else if (GlobalsHandler_1.bracketHighlightGlobals.enabledLanguages.includes(activeEditor.document.languageId) === false) {
        return;
    }
    let currentSelection = activeEditor.selection;
    if (GlobalsHandler_1.bracketHighlightGlobals.lastSelection === undefined) {
        GlobalsHandler_1.bracketHighlightGlobals.lastSelection = currentSelection;
    }
    if (currentSelection.start !== GlobalsHandler_1.bracketHighlightGlobals.lastSelection.start) {
        onSelectionChangeEvent(currentSelection);
    }
    GlobalsHandler_1.bracketHighlightGlobals.lastSelection = currentSelection;
    if (GlobalsHandler_1.bracketHighlightGlobals.handleTextSelectionEventActive === false) {
        return;
    }
    /*************************************************************************************************************************************/
    removePreviousDecorations();
    let rangesForBlur = [];
    let rangesForHighlight = [];
    let startSymbol = { symbol: "", offset: 0 };
    for (let selection of activeEditor.selections) {
        let symbolType = GlobalsHandler_1.bracketHighlightGlobals.reverseSearchEnabled ? Util.SymbolType.ALLSYMBOLS : Util.SymbolType.STARTSYMBOL;
        startSymbol = Util.getSymbolFromPosition_legacy(activeEditor, selection.active, symbolType, 0);
        let scopeRanges = getScopeRanges(activeEditor, selection, startSymbol);
        if (scopeRanges.highlightRanges.length === 0) {
            return;
        }
        rangesForHighlight.push(scopeRanges.highlightRanges);
        rangesForBlur.push(scopeRanges.blurRanges);
        GlobalsHandler_1.bracketHighlightGlobals.highlightSymbols.push(startSymbol.symbol);
    }
    rangesForHighlight = rangesForHighlight.filter(range => range.length > 0);
    rangesForBlur = rangesForBlur.filter(range => range.length > 0);
    handleHighlightRanges(activeEditor, rangesForHighlight);
    blurNonHighlightedRanges(activeEditor, rangesForBlur);
}
function getSelectionRange(activeEditor, startSymbol, startSymbols, counterPartSymbols, startPosition) {
    let selectionRange = [];
    let symbolFinder = new SymbolFinder.SymbolFinder();
    let usedSymbol = "";
    for (let counterPartSymbol of counterPartSymbols) {
        let possibleRange = symbolFinder.findMatchingSymbolPosition(activeEditor, startSymbol, startSymbols, counterPartSymbol, counterPartSymbols, startPosition);
        let rangeText = activeEditor.document.getText(possibleRange[possibleRange.length - 1]);
        if (rangeText.includes(counterPartSymbol)) {
            selectionRange = possibleRange;
            usedSymbol = counterPartSymbol;
        }
    }
    return { selectionRange, usedSymbol };
}
/******************************************************************************************************************************************
* Gets ranges to highlight and ranges to blur from given selection and symbols
*	activeEditor: Currently used editor
*	selection: Current selection
*	startSymbol: Symbol containing the offset from the cursor and the string representation
******************************************************************************************************************************************/
function getScopeRanges(activeEditor, selection, startSymbol) {
    let selectionRange = { selectionRange: [], usedSymbol: "" };
    let rangesForBlur = [];
    let rangesForHighlight = [];
    let counterPartSymbols = [];
    let symbolHandler = new SymbolHandler.SymbolHandler();
    let startPosition = new vscode.Position(0, 0);
    let symbolRanges = [];
    GlobalsHandler_1.bracketHighlightGlobals.searchDirection = (symbolHandler.isValidStartSymbol(startSymbol.symbol)) ? GlobalsHandler_2.SearchDirection.FORWARDS : GlobalsHandler_2.SearchDirection.BACKWARDS;
    if (startSymbol.symbol !== "") {
        startPosition = getStartPosition(activeEditor, selection.active, startSymbol.symbol, startSymbol.offset);
        counterPartSymbols = symbolHandler.getCounterParts(startSymbol.symbol);
    }
    else if (GlobalsHandler_1.bracketHighlightGlobals.highlightScopeFromText === true) {
        startPosition = selection.active;
        let symbolFinder = new SymbolFinder.SymbolFinder();
        let textLines = activeEditor.document.getText(new vscode.Range(activeEditor.document.positionAt(0), startPosition)).split("\n");
        symbolRanges = symbolFinder.findDepth1Backwards(activeEditor, startPosition, textLines, symbolHandler.getUniqueValidStartSymbols(), symbolHandler.getUniqueValidEndSymbols());
        if (symbolRanges.length === 0) {
            return { highlightRanges: [], blurRanges: [] };
        }
        startSymbol.symbol = symbolRanges[0].symbol;
        counterPartSymbols = symbolHandler.getCounterParts(symbolRanges[0].symbol);
        GlobalsHandler_1.bracketHighlightGlobals.searchDirection = GlobalsHandler_2.SearchDirection.FORWARDS;
        startPosition = symbolRanges[0].symbolPosition;
    }
    let validSymbols = symbolHandler.getValidSymbolsWithSameEndSymbol(startSymbol.symbol);
    selectionRange = getSelectionRange(activeEditor, startSymbol.symbol, validSymbols, counterPartSymbols, startPosition);
    if (GlobalsHandler_1.bracketHighlightGlobals.highlightScopeFromText === true && selectionRange.selectionRange.length === 0) {
        let currentIndex = 1; /* The first symbol was already checked in the lines above */
        while (selectionRange.selectionRange.length === 0 && currentIndex < symbolRanges.length) {
            startSymbol.symbol = symbolRanges[currentIndex].symbol;
            counterPartSymbols = symbolHandler.getCounterParts(symbolRanges[currentIndex].symbol);
            startPosition = symbolRanges[currentIndex].symbolPosition;
            validSymbols = symbolHandler.getValidSymbolsWithSameEndSymbol(startSymbol.symbol);
            selectionRange = getSelectionRange(activeEditor, startSymbol.symbol, validSymbols, counterPartSymbols, startPosition);
            currentIndex++;
        }
    }
    GlobalsHandler_1.bracketHighlightGlobals.highlightSymbols.push(startSymbol.symbol);
    if (GlobalsHandler_1.bracketHighlightGlobals.searchDirection === GlobalsHandler_2.SearchDirection.BACKWARDS) {
        selectionRange.selectionRange = selectionRange.selectionRange.reverse();
    }
    if (GlobalsHandler_1.bracketHighlightGlobals.ignoreContent) {
        rangesForBlur = rangesForBlur.concat(selectionRange.selectionRange);
        if (GlobalsHandler_1.bracketHighlightGlobals.searchDirection === GlobalsHandler_2.SearchDirection.BACKWARDS) {
            rangesForHighlight = rangesForHighlight.concat(filterSymbols(selectionRange.selectionRange, selectionRange.usedSymbol.length, startSymbol.symbol.length));
        }
        else {
            rangesForHighlight = rangesForHighlight.concat(filterSymbols(selectionRange.selectionRange, startSymbol.symbol.length, selectionRange.usedSymbol.length));
        }
    }
    else {
        rangesForHighlight = rangesForHighlight.concat(selectionRange.selectionRange);
        rangesForBlur = rangesForHighlight;
    }
    return { highlightRanges: rangesForHighlight, blurRanges: rangesForBlur };
}
/******************************************************************************************************************************************
* Blurs a given range
*	activeEditor: Currently used editor
*	range: Range to blur
******************************************************************************************************************************************/
function blurRange(activeEditor, range) {
    let highlighter = new Highlighter.Highlighter();
    let decorationType = vscode.window.createTextEditorDecorationType({
        opacity: GlobalsHandler_1.bracketHighlightGlobals.opacity
    });
    highlighter.highlightRange(activeEditor, decorationType, range);
    GlobalsHandler_1.bracketHighlightGlobals.decorationTypes.push(decorationType);
}
/******************************************************************************************************************************************
* Takes ranges which were highlighted and blurs all ranges which weren't highlighted
*	activeEditor: Currently used editor
*	highlightRanges: Ranges which are highlighted (used to determine which ranges shall be blurred)
******************************************************************************************************************************************/
function blurNonHighlightedRanges(activeEditor, highlightRangesArr) {
    if (GlobalsHandler_1.bracketHighlightGlobals.blurOutOfScopeText === true) {
        if (GlobalsHandler_1.bracketHighlightGlobals.searchDirection === GlobalsHandler_2.SearchDirection.BACKWARDS) {
            highlightRangesArr = highlightRangesArr.reverse();
        }
        highlightRangesArr = highlightRangesArr.sort(function (ranges1, ranges2) {
            let range1 = ranges1[0];
            let range2 = ranges2[0];
            return range1.start.line - range2.start.line;
        });
        /* Blur everything to the first highlight range */
        let startPosition = new vscode.Position(0, 0);
        let endPosition = new vscode.Position(highlightRangesArr[0][0].start.line, highlightRangesArr[0][0].start.character);
        let range = new vscode.Range(startPosition, endPosition);
        blurRange(activeEditor, range);
        /* Blur everything between the highlight ranges */
        let holeIndices = highlightRangesArr.length - 1;
        let currentIndex = 0;
        while (currentIndex < holeIndices) {
            startPosition = new vscode.Position(highlightRangesArr[currentIndex][highlightRangesArr[currentIndex].length - 1].end.line, highlightRangesArr[currentIndex][highlightRangesArr[currentIndex].length - 1].end.character);
            endPosition = new vscode.Position(highlightRangesArr[currentIndex + 1][0].start.line, highlightRangesArr[currentIndex + 1][0].start.character);
            range = new vscode.Range(startPosition, endPosition);
            blurRange(activeEditor, range);
            currentIndex++;
        }
        /* Blur everything from the last highlight range to the end of the file */
        let lineCount = activeEditor.document.lineCount;
        let lastLine = activeEditor.document.lineAt(lineCount - 1);
        startPosition = new vscode.Position(highlightRangesArr[highlightRangesArr.length - 1][highlightRangesArr[highlightRangesArr.length - 1].length - 1].start.line, highlightRangesArr[highlightRangesArr.length - 1][highlightRangesArr[highlightRangesArr.length - 1].length - 1].end.character);
        endPosition = new vscode.Position(lastLine.range.start.line, lastLine.range.end.character);
        range = new vscode.Range(startPosition, endPosition);
        blurRange(activeEditor, range);
    }
}
/******************************************************************************************************************************************
* Filters all symbols between opening and closing symbols.
*	textRanges: Ranges where everything except the first and last range shall be filtered
*	startSymbolLength: Length of the start symbol
*	counterPartSymbolLength: Length of the counter part symbol
******************************************************************************************************************************************/
function filterSymbols(textRanges, startSymbolLength, counterPartSymbolLength) {
    let returnRanges = [];
    let startPosition;
    let endPosition;
    if (textRanges.length === 0) {
        return []; /* Shouldn't be able to happen */
    }
    else if (textRanges.length === 1) {
        startPosition = textRanges[0].start;
        endPosition = textRanges[0].end;
    }
    else {
        startPosition = textRanges[0].start;
        endPosition = textRanges[textRanges.length - 1].end;
    }
    let endPositionOpeningBracket = startPosition.translate(0, startSymbolLength);
    let startPositionClosingBracket = endPosition.translate(0, -counterPartSymbolLength);
    let startRange = new vscode.Range(startPosition, endPositionOpeningBracket);
    let endRange = new vscode.Range(startPositionClosingBracket, endPosition);
    returnRanges.push(startRange);
    returnRanges.push(endRange);
    return returnRanges;
}
/******************************************************************************************************************************************
* Highlights ranges with the configured decorations
*	activeEditor: Editor containing the ranges
*	textRanges: Ranges to highlight
******************************************************************************************************************************************/
function handleHighlightRanges(activeEditor, textRanges) {
    let highlighter = new Highlighter.Highlighter();
    let decorationHandler = new DecorationHandler.DecorationHandler();
    let decorationTypes = [];
    for (let textRange of textRanges) {
        decorationTypes = decorationTypes.concat(highlighter.highlightRanges(activeEditor, decorationHandler, textRange));
    }
    GlobalsHandler_1.bracketHighlightGlobals.decorationTypes = decorationTypes;
    GlobalsHandler_1.bracketHighlightGlobals.decorationStatus = true;
    GlobalsHandler_1.bracketHighlightGlobals.highlightRanges = textRanges;
}
/******************************************************************************************************************************************
* Removes all previous decorations
******************************************************************************************************************************************/
function removePreviousDecorations() {
    if (GlobalsHandler_1.bracketHighlightGlobals.decorationStatus === true) {
        let highlighter = new Highlighter.Highlighter();
        highlighter.removeHighlights(GlobalsHandler_1.bracketHighlightGlobals.decorationTypes);
        GlobalsHandler_1.bracketHighlightGlobals.decorationStatus = false;
        GlobalsHandler_1.bracketHighlightGlobals.highlightSymbols = [];
        GlobalsHandler_1.bracketHighlightGlobals.highlightRanges = [];
    }
}
/******************************************************************************************************************************************
* Corrects the start position to the symbol in the forward search.
*	activeEditor: Editor containing the selectionStart
*	selectionStart: Selection from where the search shall begin
*	startSymbol: Symbol to search for
*	offset: Offset where the symbol around the selection was found (Gives information where the symbol is relative to the cursor)
******************************************************************************************************************************************/
function getPositionInTextForwardSearch(activeEditor, selectionStart, startSymbol, offset) {
    let symbolFinder = new SymbolFinder.SymbolFinder();
    let internalOffset = -offset;
    let oldSelectionStartPosition = selectionStart.translate(0, offset);
    let newSelectionStartPosition = selectionStart.translate(0, offset);
    let startPosition = oldSelectionStartPosition;
    let endPosition = selectionStart;
    if (offset === 0) {
        endPosition = endPosition.translate(0, 1);
    }
    let selectionSymbol = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
    let letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
    while (letterIndices.length > 1) {
        if (oldSelectionStartPosition.character > 0) {
            newSelectionStartPosition = oldSelectionStartPosition.translate(0, -1);
            selectionSymbol = activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition)) + selectionSymbol;
            letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
            oldSelectionStartPosition = newSelectionStartPosition;
            internalOffset++;
        }
        else {
            break;
        }
    }
    if (letterIndices.length === 0 && selectionSymbol.length > 0) {
        selectionSymbol = selectionSymbol.slice(1, selectionSymbol.length);
        letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
        return selectionStart.translate(0, -(internalOffset - 1));
    }
    oldSelectionStartPosition = selectionStart;
    while (letterIndices.length > 1) {
        let newSelectionStartPosition = oldSelectionStartPosition.translate(0, 1);
        selectionSymbol = selectionSymbol + activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition));
        letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
        oldSelectionStartPosition = newSelectionStartPosition;
    }
    if (letterIndices.length > 0 && letterIndices[0] !== -1) {
        return selectionStart.translate(0, -letterIndices[0] - internalOffset);
    }
    return oldSelectionStartPosition;
}
/******************************************************************************************************************************************
* Corrects the start position to the symbol in the backward search.
*	activeEditor: Currently used editor
*	selectionStart: Selection from where to start the search
*	startSymbol: Symbol to search for
*	offset: Offset where the symbol around the selection was found (Gives information where the symbol is relative to the cursor)
******************************************************************************************************************************************/
function getPositionInTextBackwardSearch(activeEditor, selectionStart, startSymbol, offset) {
    let symbolFinder = new SymbolFinder.SymbolFinder();
    let symbolLength = startSymbol.length;
    let internalOffset = offset;
    let oldSelectionStartPosition = selectionStart;
    let startPosition = selectionStart.translate(0, offset);
    let endPosition = selectionStart;
    if (offset === 0) {
        endPosition = endPosition.translate(0, 1);
    }
    let selectionSymbol = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
    let letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
    /* Search until unique sequence is found in string */
    while (letterIndices.length > 1) {
        if (oldSelectionStartPosition.character > 0) {
            let newSelectionStartPosition = oldSelectionStartPosition.translate(0, -1);
            selectionSymbol = activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition)) + selectionSymbol;
            letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
            oldSelectionStartPosition = newSelectionStartPosition;
            internalOffset++;
        }
        else {
            break;
        }
    }
    oldSelectionStartPosition = selectionStart;
    while (letterIndices.length > 1) {
        let newSelectionStartPosition = oldSelectionStartPosition.translate(0, 1);
        selectionSymbol = selectionSymbol + activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition));
        letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
        oldSelectionStartPosition = newSelectionStartPosition;
    }
    if (letterIndices[0] !== -1 && letterIndices.length > 0) {
        return selectionStart.translate(0, symbolLength - letterIndices[0] + internalOffset);
    }
    return selectionStart;
}
/******************************************************************************************************************************************
* Corrects the start position to the symbol. Will put the cursor before a starting symbol (includes it) and behind a closing symbol (includes it). Differentiates between forward and backward search
*	activeEditor: Currently used editor
*	selectionStart: Selection from where to start the search
*	startSymbol: Symbol to search for
*	offset: Offset where the symbol around the selection was found (Gives information where the symbol is relative to the cursor)
******************************************************************************************************************************************/
function getStartPosition(activeEditor, selectionStart, startSymbol, offset) {
    let shiftDirection = 1;
    let shiftLength;
    if (GlobalsHandler_1.bracketHighlightGlobals.searchDirection === GlobalsHandler_2.SearchDirection.FORWARDS) {
        shiftDirection = -1;
        shiftLength = selectionStart.character - getPositionInTextForwardSearch(activeEditor, selectionStart, startSymbol, offset).character;
    }
    else {
        shiftLength = getPositionInTextBackwardSearch(activeEditor, selectionStart, startSymbol, offset).character - selectionStart.character;
    }
    return selectionStart.translate(0, shiftDirection * shiftLength);
}
/******************************************************************************************************************************************
* Handles the text selection event
*	state: State to toggle to. Enables or disables the extension if set.
******************************************************************************************************************************************/
function setTextSelectionEventHandling(state) {
    GlobalsHandler_1.bracketHighlightGlobals.handleTextSelectionEventActive = state;
}
/******************************************************************************************************************************************
* Checks if the current selection is in the previously highlighted range
*	currentSelection: Selection to check
******************************************************************************************************************************************/
function isSelectionInPreviousRange(currentSelection) {
    let selectionContained = false;
    for (let highlightRanges of GlobalsHandler_1.bracketHighlightGlobals.highlightRanges) {
        let highlightRange = new vscode.Range(highlightRanges[0].start, highlightRanges[highlightRanges.length - 1].end);
        selectionContained = highlightRange.contains(currentSelection);
    }
    return selectionContained;
}
/******************************************************************************************************************************************
* Clears the timeout of the global timer handle and resets the timer.
******************************************************************************************************************************************/
function clearTimer() {
    clearTimeout(GlobalsHandler_1.bracketHighlightGlobals.disableTimer);
    GlobalsHandler_1.bracketHighlightGlobals.disableTimer = null;
}
/******************************************************************************************************************************************
* Business logic, which shall be executed once the timeout with the configured time span occurs.
******************************************************************************************************************************************/
function timeoutFunction() {
    setTextSelectionEventHandling(true);
    GlobalsHandler_1.bracketHighlightGlobals.lastSelection = undefined;
    handleTextSelectionEvent();
    GlobalsHandler_1.bracketHighlightGlobals.disableTimer = null;
}
/******************************************************************************************************************************************
* Handles the selection change event. Enables/Disables the extension for a certain amount of time.
*	currentSelection: Selection used to determine if highlighting is necessary
******************************************************************************************************************************************/
function onSelectionChangeEvent(currentSelection) {
    if (isSelectionInPreviousRange(currentSelection)) {
        if (GlobalsHandler_1.bracketHighlightGlobals.disableTimer !== null) {
            clearTimer();
        }
        setTextSelectionEventHandling(false);
        GlobalsHandler_1.bracketHighlightGlobals.disableTimer = setTimeout(timeoutFunction, GlobalsHandler_1.bracketHighlightGlobals.timeOutValue);
    }
    else {
        if (GlobalsHandler_1.bracketHighlightGlobals.disableTimer !== null) {
            clearTimer();
        }
        setTextSelectionEventHandling(true);
    }
}
//# sourceMappingURL=extension.js.map