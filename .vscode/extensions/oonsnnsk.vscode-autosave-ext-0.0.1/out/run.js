"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAutoSaveExt = void 0;
const xstream_1 = __importDefault(require("xstream"));
const path_1 = require("path");
const delay_1 = __importDefault(require("xstream/extra/delay"));
const sampleCombine_1 = __importDefault(require("xstream/extra/sampleCombine"));
const debounce_1 = require("./debounce");
const testFilePath = (filePath, config) => {
    if (config.extensions.length) {
        const ext = path_1.extname(filePath);
        return config.extensions.includes(ext);
    }
    return true;
};
exports.runAutoSaveExt = ({ getEvents, log, }) => {
    const config$ = getEvents('configChanged');
    const docChanged$ = config$
        .map((config) => {
        if (!config)
            return xstream_1.default.empty();
        const docSaved$ = getEvents('fileSaved')
            .filter((doc) => testFilePath(doc.uri.fsPath, config))
            .map((d) => {
            return xstream_1.default.merge(xstream_1.default.of(d), xstream_1.default.of(null).compose(delay_1.default(500)));
        })
            .flatten()
            .startWith(null)
            .debug((d) => d && log('File saved:', d.uri.fsPath));
        return getEvents('fileChanged')
            .filter((doc) => testFilePath(doc.uri.fsPath, config))
            .compose(debounce_1.debounceBy((_) => _, config.debounce))
            .debug((d) => log('changed after debounce', d.uri.fsPath))
            .compose(sampleCombine_1.default(docSaved$))
            .debug(([d1, d2]) => log('changed', d1.uri.fsPath, 'last saved', (d2 === null || d2 === void 0 ? void 0 : d2.uri.fsPath) || 'null'))
            .filter(([d, lastSaved]) => d.uri.fsPath !== (lastSaved === null || lastSaved === void 0 ? void 0 : lastSaved.uri.fsPath))
            .map(([d]) => d)
            .debug((d) => log('changed pass', d.uri.fsPath));
    })
        .flatten();
    docChanged$.addListener({
        next: (d) => {
            log('Saving changed file:', d.uri.fsPath);
            d.save();
        },
    });
    config$.addListener({
        next: (config) => {
            if (config) {
                log('Autosave enabled with settings:\n', JSON.stringify(config, null, 2));
            }
            else {
                log('Autosave is not enabled in this workspace.');
            }
        },
    });
};
//# sourceMappingURL=run.js.map