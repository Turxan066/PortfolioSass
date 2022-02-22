"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotkeyHandler = void 0;
const vscode = require("vscode");
const GlobalsHandler_1 = require("./GlobalsHandler");
const ConfigHandler_1 = require("./ConfigHandler");
const Util = require("./Util");
class HotkeyHandler {
    onActivateHotkey() {
        GlobalsHandler_1.bracketHighlightGlobals.extensionEnabled = !GlobalsHandler_1.bracketHighlightGlobals.extensionEnabled;
        let configHandler = new ConfigHandler_1.ConfigHandler();
        configHandler.setExtensionEnabledStatus(GlobalsHandler_1.bracketHighlightGlobals.extensionEnabled);
    }
    onJumpOutOfOpeningSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let newSelectionPositions = [];
        for (let range of GlobalsHandler_1.bracketHighlightGlobals.highlightRanges) {
            newSelectionPositions.push(range[0].start);
        }
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }
    onJumpOutOfClosingSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let newSelectionPositions = [];
        for (let range of GlobalsHandler_1.bracketHighlightGlobals.highlightRanges) {
            newSelectionPositions.push(range[range.length - 1].end);
        }
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }
    onJumpToOpeningSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let newSelectionPositions = [];
        for (let index = 0; index < GlobalsHandler_1.bracketHighlightGlobals.highlightRanges.length; index++) {
            let range = GlobalsHandler_1.bracketHighlightGlobals.highlightRanges[index];
            let symbol = this.getStartSymbol(index);
            let newSelectionPosition = range[0].start;
            newSelectionPosition = this.correctStartPosition(symbol, newSelectionPosition);
            newSelectionPosition = newSelectionPosition.translate(0, 1);
            newSelectionPositions.push(newSelectionPosition);
        }
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }
    onJumpToClosingSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let newSelectionPositions = [];
        for (let index = 0; index < GlobalsHandler_1.bracketHighlightGlobals.highlightRanges.length; index++) {
            let range = GlobalsHandler_1.bracketHighlightGlobals.highlightRanges[index];
            let symbol = this.getStartSymbol(index);
            let newSelectionPosition = range[range.length - 1].end;
            let counterPartSymbol = this.getEndSymbolAtPosition(activeEditor, symbol, newSelectionPosition);
            newSelectionPosition = this.correctEndPosition(counterPartSymbol, newSelectionPosition);
            let offset = -1;
            if (newSelectionPosition.character === 0) {
                offset = 0;
            }
            newSelectionPosition = newSelectionPosition.translate(0, offset);
            newSelectionPositions.push(newSelectionPosition);
        }
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }
    onSelectTextBetweenSymbolsHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let selectionRanges = [];
        for (let index = 0; index < GlobalsHandler_1.bracketHighlightGlobals.highlightRanges.length; index++) {
            let range = GlobalsHandler_1.bracketHighlightGlobals.highlightRanges[index];
            let symbol = this.getStartSymbol(index);
            let selectionStart = range[0].start;
            let selectionEnd = range[range.length - 1].end;
            let counterPartSymbol = this.getEndSymbolAtPosition(activeEditor, symbol, selectionEnd);
            selectionStart = this.correctStartPosition(symbol, selectionStart);
            selectionEnd = this.correctEndPosition(counterPartSymbol, selectionEnd);
            selectionRanges.push(new vscode.Range(selectionStart, selectionEnd));
        }
        this.setSelectionRanges(activeEditor, selectionRanges);
    }
    setSelectionPositions(activeEditor, newPositions) {
        let newSelections = [];
        for (let i = 0; i < newPositions.length; i++) {
            newSelections.push(new vscode.Selection(newPositions[i], newPositions[i]));
        }
        activeEditor.selections = newSelections;
    }
    setSelectionRanges(activeEditor, newRanges) {
        let newSelections = [];
        for (let i = 0; i < newRanges.length; i++) {
            let startOffset = 1;
            let endOffset = -1;
            if (newRanges[i].end.character === 0) {
                endOffset = 0;
            }
            newSelections.push(new vscode.Selection(newRanges[i].end.translate(0, endOffset), newRanges[i].start.translate(0, startOffset)));
        }
        activeEditor.selections = newSelections;
    }
    getEndSymbolAtPosition(activeEditor, symbol, position) {
        return Util.getSymbolFromPosition_legacy(activeEditor, position, Util.SymbolType.ENDSYMBOL, 0).symbol;
    }
    correctStartPosition(startSymbol, startPosition) {
        return startPosition.translate(0, startSymbol.length - 1);
    }
    correctEndPosition(endSymbol, endPosition) {
        return endPosition.translate(0, -endSymbol.length + 1);
    }
    getStartSymbol(index) {
        return GlobalsHandler_1.bracketHighlightGlobals.highlightSymbols[index];
    }
    getEndSymbol(index) {
        return GlobalsHandler_1.bracketHighlightGlobals.highlightSymbols[index];
    }
}
exports.default = HotkeyHandler;
exports.HotkeyHandler = HotkeyHandler;
//# sourceMappingURL=ActionHandler.js.map