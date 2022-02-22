"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecorationHandler = exports.DecorationOptions = void 0;
const vscode = require("vscode");
const ConfigHandler = require("./ConfigHandler");
class DecorationHandler {
    getDecorationType() {
        let configHandler = new ConfigHandler.ConfigHandler();
        let decorationOptions = configHandler.getDecorationOptions();
        let decorationType = vscode.window.createTextEditorDecorationType({
            color: decorationOptions.color,
            fontWeight: decorationOptions.fontWeight,
            fontStyle: decorationOptions.fontStyle,
            letterSpacing: decorationOptions.letterSpacing,
            outline: decorationOptions.outline,
            border: decorationOptions.border,
            textDecoration: decorationOptions.textDecoration,
            backgroundColor: decorationOptions.backgroundColor,
            overviewRulerLane: vscode.OverviewRulerLane.Left,
            overviewRulerColor: decorationOptions.backgroundColor,
        });
        return decorationType;
    }
}
exports.default = DecorationHandler;
exports.DecorationHandler = DecorationHandler;
class DecorationOptions {
    constructor(fontWeight, fontStyle, letterSpacing, outline, border, textDecoration, backgroundColor, color) {
        this.color = color;
        this.fontWeight = fontWeight;
        this.fontStyle = fontStyle;
        this.letterSpacing = letterSpacing;
        this.outline = outline;
        this.border = border;
        this.textDecoration = textDecoration;
        this.backgroundColor = backgroundColor;
    }
}
exports.DecorationOptions = DecorationOptions;
//# sourceMappingURL=DecorationHandler.js.map