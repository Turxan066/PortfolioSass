"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = __importDefault(require("vscode"));
const run_1 = require("./run");
const emitter_1 = require("./emitter");
const defaultConfig = {
    debounce: 500,
    extensions: [],
};
const outputChannelName = 'AutoSaveExt';
const decodeConfig = (val) => {
    return {
        debounce: typeof val.debounce === 'number' && val.debounce > 0
            ? val.debounce
            : defaultConfig.debounce,
        extensions: (val.extensions || []).map((val) => '.' + val.replace('.', '')),
    };
};
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
// https://code.visualstudio.com/api/references/activation-events
// AutoSaveExt extension is activated onStartupFinished
function activate(context) {
    const { getEvents, emitEvent } = emitter_1.makeEmitter();
    vscode_1.default.workspace.onDidSaveTextDocument((document) => {
        emitEvent('fileSaved', document);
    });
    vscode_1.default.workspace.onDidChangeTextDocument(({ document }) => {
        emitEvent('fileChanged', document);
    });
    const getConfig = () => {
        const settingConfig = vscode_1.default.workspace
            .getConfiguration()
            .get('autoSaveExt');
        const configVal = settingConfig
            ? decodeConfig(settingConfig)
            : null;
        emitEvent('configChanged', configVal);
    };
    const disposable = vscode_1.default.commands.registerCommand('autoSaveExt.reloadConfig', () => {
        getConfig();
    });
    context.subscriptions.push(disposable);
    const output = vscode_1.default.window.createOutputChannel(outputChannelName);
    run_1.runAutoSaveExt({
        getEvents,
        log: (...args) => {
            output.appendLine(args.join(' '));
        },
    });
    getConfig();
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map