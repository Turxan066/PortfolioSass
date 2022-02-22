"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigHandler = void 0;
const vscode = require("vscode");
const DecorationOptions = require("./DecorationHandler");
class ConfigHandler {
    constructor() { }
    getConfiguration() {
        return vscode.workspace.getConfiguration("BracketHighlighter", null);
    }
    highlightScopeFromText() {
        const config = this.getConfiguration();
        let highlightScopeFromText = config.get("highlightScopeFromText");
        if (highlightScopeFromText === undefined) {
            highlightScopeFromText = false;
        }
        return highlightScopeFromText;
    }
    blurOutOfScopeText() {
        const config = this.getConfiguration();
        let blurOutOfScopeText = config.get("blurOutOfScopeText");
        if (blurOutOfScopeText === undefined) {
            blurOutOfScopeText = false;
        }
        return blurOutOfScopeText;
    }
    getOpacity() {
        const config = this.getConfiguration();
        let opacity = config.get("blurOpacity");
        if (opacity === undefined) {
            opacity = '0.5';
        }
        return opacity;
    }
    activeWhenDebugging() {
        const config = this.getConfiguration();
        let activeInDebug = config.get("activeInDebugMode");
        if (activeInDebug === undefined) {
            activeInDebug = true;
        }
        return activeInDebug;
    }
    getMaxLineSearchCount() {
        const config = this.getConfiguration();
        let maxLineSearchCount = config.get("maxLineSearchCount");
        if (maxLineSearchCount === undefined) {
            maxLineSearchCount = 1000;
        }
        return maxLineSearchCount;
    }
    getDecorationOptions() {
        const config = this.getConfiguration();
        let fontWeight = config.get("fontWeight");
        let fontStyle = config.get("fontStyle");
        let letterSpacing = config.get("letterSpacing");
        let outline = config.get("outline");
        let border = config.get("border");
        let backgroundColor = config.get("backgroundColor");
        let textDecoration = config.get("textDecoration");
        let textColor = config.get("textColor");
        return new DecorationOptions.DecorationOptions(fontWeight, fontStyle, letterSpacing, outline, border, textDecoration, backgroundColor, textColor);
    }
    getEnabledLanguages() {
        const config = this.getConfiguration();
        let allowedLanguageIdString = config.get("allowedLanguageIds");
        if (allowedLanguageIdString === undefined) {
            return [];
        }
        allowedLanguageIdString = allowedLanguageIdString.replace(/\s/g, "");
        let allowedLanguageIds = allowedLanguageIdString.split(",");
        return allowedLanguageIds;
    }
    reverseSearchEnabled() {
        const config = this.getConfiguration();
        let reverseSearchEnabled = config.get("reverseSearchEnabled");
        if (reverseSearchEnabled === undefined) {
            reverseSearchEnabled = true;
        }
        return reverseSearchEnabled;
    }
    getCustomSymbols() {
        const config = this.getConfiguration();
        let customSymbols = config.get("customSymbols");
        if (customSymbols === undefined) {
            customSymbols = [{}];
        }
        let customStartSymbols = [];
        let customEndSymbols = [];
        for (let customSymbol of customSymbols) {
            if (customSymbol.hasOwnProperty("open") && customSymbol.hasOwnProperty("close")) {
                if (customSymbol.open !== customSymbol.close) {
                    customStartSymbols.push(customSymbol.open);
                    customEndSymbols.push(customSymbol.close);
                }
            }
        }
        return {
            startSymbols: customStartSymbols,
            endSymbols: customEndSymbols
        };
    }
    getAllowedStartSymbols() {
        const config = this.getConfiguration();
        let validStartSymbols = [];
        let useForSymbols;
        useForSymbols = config.get("useParentheses");
        if (useForSymbols === true) {
            validStartSymbols.push("(");
        }
        useForSymbols = config.get("useBraces");
        if (useForSymbols === true) {
            validStartSymbols.push("{");
        }
        useForSymbols = config.get("useBrackets");
        if (useForSymbols === true) {
            validStartSymbols.push("[");
        }
        useForSymbols = config.get("useAngularBrackets");
        if (useForSymbols === true) {
            validStartSymbols.push("<");
        }
        validStartSymbols = validStartSymbols.concat(this.getCustomSymbols().startSymbols);
        return validStartSymbols;
    }
    getAllowedEndSymbols() {
        const config = this.getConfiguration();
        let validEndSymbols = [];
        let useForSymbols;
        useForSymbols = config.get("useParentheses");
        if (useForSymbols === true) {
            validEndSymbols.push(")");
        }
        useForSymbols = config.get("useBraces");
        if (useForSymbols === true) {
            validEndSymbols.push("}");
        }
        useForSymbols = config.get("useBrackets");
        if (useForSymbols === true) {
            validEndSymbols.push("]");
        }
        useForSymbols = config.get("useAngularBrackets");
        if (useForSymbols === true) {
            validEndSymbols.push(">");
        }
        validEndSymbols = validEndSymbols.concat(this.getCustomSymbols().endSymbols);
        return validEndSymbols;
    }
    isExtensionEnabled() {
        const config = this.getConfiguration();
        let extensionEnabled = config.get("enableExtension");
        if (extensionEnabled === undefined) {
            extensionEnabled = true;
        }
        return extensionEnabled;
    }
    setExtensionEnabledStatus(extensionEnabled) {
        let config = this.getConfiguration();
        config.update("enableExtension", extensionEnabled);
    }
    getTimeOutValue() {
        let config = this.getConfiguration();
        let timeOutValue = config.get("timeOutValue");
        if (timeOutValue === undefined) {
            timeOutValue = 600;
        }
        return timeOutValue;
    }
    ignoreContent() {
        let config = this.getConfiguration();
        let ignoreContent = config.get("ignoreContent");
        if (ignoreContent === undefined) {
            ignoreContent = true;
        }
        return ignoreContent;
    }
    getTextColor() {
        const config = this.getConfiguration();
        let textColor = config.get("textColor");
        if (textColor === undefined) {
            textColor = '';
        }
        return textColor;
    }
    regexMode() {
        let config = this.getConfiguration();
        let regexMode = config.get("regexMode");
        if (regexMode === undefined) {
            regexMode = false;
        }
        return regexMode;
    }
}
exports.default = ConfigHandler;
exports.ConfigHandler = ConfigHandler;
//# sourceMappingURL=ConfigHandler.js.map