"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchDirection = exports.bracketHighlightGlobals = void 0;
const ConfigHandler = require("./ConfigHandler");
var SearchDirection;
(function (SearchDirection) {
    SearchDirection[SearchDirection["FORWARDS"] = 0] = "FORWARDS";
    SearchDirection[SearchDirection["BACKWARDS"] = 1] = "BACKWARDS";
})(SearchDirection || (SearchDirection = {}));
exports.SearchDirection = SearchDirection;
class GlobalsHandler {
    constructor() {
        this.configHandler = new ConfigHandler.ConfigHandler();
        this.decorationStatus = false;
        this.decorationTypes = [];
        this.searchDirection = SearchDirection.FORWARDS;
        this.handleTextSelectionEventActive = true;
        this.disableTimer = null;
        this.highlightRanges = [];
        this.highlightSymbols = [];
        this.onConfigChange();
    }
    onConfigChange() {
        /* Config parameters */
        this.blurOutOfScopeText = this.configHandler.blurOutOfScopeText();
        this.opacity = this.configHandler.getOpacity();
        this.textColor = this.configHandler.getTextColor();
        this.activeWhenDebugging = this.configHandler.activeWhenDebugging();
        this.maxLineSearchCount = this.configHandler.getMaxLineSearchCount();
        this.decorationOptions = this.configHandler.getDecorationOptions();
        this.enabledLanguages = this.configHandler.getEnabledLanguages();
        this.reverseSearchEnabled = this.configHandler.reverseSearchEnabled();
        this.allowedStartSymbols = this.configHandler.getAllowedStartSymbols();
        this.allowedEndSymbols = this.configHandler.getAllowedEndSymbols();
        this.highlightScopeFromText = this.configHandler.highlightScopeFromText();
        this.extensionEnabled = this.configHandler.isExtensionEnabled();
        this.timeOutValue = this.configHandler.getTimeOutValue();
        this.ignoreContent = this.configHandler.ignoreContent();
        this.regexMode = this.configHandler.regexMode();
    }
}
exports.default = GlobalsHandler;
var bracketHighlightGlobals = new GlobalsHandler();
exports.bracketHighlightGlobals = bracketHighlightGlobals;
//# sourceMappingURL=GlobalsHandler.js.map