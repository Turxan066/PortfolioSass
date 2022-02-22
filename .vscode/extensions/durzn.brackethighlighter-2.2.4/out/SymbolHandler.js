"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolHandler = void 0;
const GlobalsHandler_1 = require("./GlobalsHandler");
class SymbolHandler {
    getCounterParts(symbol) {
        let validSymbols = [];
        let counterPartSymbols = [];
        let foundSymbols = [];
        if (this.isValidStartSymbol(symbol) === true) {
            validSymbols = this.getValidStartSymbols();
            counterPartSymbols = this.getValidEndSymbols();
        }
        else if (this.isValidEndSymbol(symbol) === true) {
            validSymbols = this.getValidEndSymbols();
            counterPartSymbols = this.getValidStartSymbols();
        }
        let index = 0;
        for (let validSymbol of validSymbols) {
            if (symbol === validSymbol) {
                foundSymbols.push(counterPartSymbols[index]);
            }
            index++;
        }
        return foundSymbols;
    }
    getValidSymbolsWithSameEndSymbol(startSymbol) {
        let symbolsWithSameEndSymbols = [];
        let validSymbols = [];
        if (this.isValidStartSymbol(startSymbol)) {
            validSymbols = this.getUniqueValidStartSymbols();
        }
        else {
            validSymbols = this.getUniqueValidEndSymbols();
        }
        let counterPartSymbolsOfValidSymbol = this.getCounterParts(startSymbol);
        for (let validSymbol of validSymbols) {
            let counterPartSymbols = this.getCounterParts(validSymbol);
            for (let counterPartSymbol of counterPartSymbols) {
                if (counterPartSymbolsOfValidSymbol.includes(counterPartSymbol)) {
                    let symbolToAppend = this.getCounterParts(counterPartSymbol);
                    symbolsWithSameEndSymbols = symbolsWithSameEndSymbols.concat(symbolToAppend);
                }
            }
        }
        return symbolsWithSameEndSymbols.filter(function (item, pos, self) {
            return self.indexOf(item) === pos;
        });
    }
    getValidStartSymbols() {
        return GlobalsHandler_1.bracketHighlightGlobals.allowedStartSymbols;
    }
    getUniqueValidStartSymbols() {
        return GlobalsHandler_1.bracketHighlightGlobals.allowedStartSymbols.filter(function (item, pos, self) {
            return self.indexOf(item) === pos;
        });
    }
    getValidEndSymbols() {
        return GlobalsHandler_1.bracketHighlightGlobals.allowedEndSymbols;
    }
    getUniqueValidEndSymbols() {
        return GlobalsHandler_1.bracketHighlightGlobals.allowedEndSymbols.filter(function (item, pos, self) {
            return self.indexOf(item) === pos;
        });
    }
    isValidStartSymbol(symbol) {
        if (this.getValidStartSymbols().includes(symbol)) {
            return true;
        }
        return false;
    }
    isValidEndSymbol(symbol) {
        if (this.getValidEndSymbols().includes(symbol)) {
            return true;
        }
        return false;
    }
}
exports.default = SymbolHandler;
exports.SymbolHandler = SymbolHandler;
//# sourceMappingURL=SymbolHandler.js.map