"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounceBy = void 0;
const xstream_1 = __importDefault(require("xstream"));
const delay_1 = __importDefault(require("xstream/extra/delay"));
/*
Helper stream operator function that applies delay based debounce
to stream parts splitting it by supplied predicate rule.
 */
exports.debounceBy = (by, debounceDelay) => {
    return (stream$) => {
        return stream$
            .fold((queue, val) => {
            const prev = queue.find((item) => by(item.val) === by(val));
            const queuedCleaned = queue.filter((item) => item.delay > 0 && item !== prev);
            const time = new Date().getTime();
            return queuedCleaned
                .map((item) => (Object.assign(Object.assign({}, item), { delay: Math.max(0, debounceDelay - (time - item.time)) })))
                .concat({
                time,
                val,
                delay: debounceDelay,
            });
        }, [])
            .map((queue) => {
            return xstream_1.default.merge(...queue.map((item) => item.delay > 0
                ? xstream_1.default.of(item.val).compose(delay_1.default(item.delay))
                : xstream_1.default.of(item.val)));
        })
            .flatten();
    };
};
//# sourceMappingURL=debounce.js.map