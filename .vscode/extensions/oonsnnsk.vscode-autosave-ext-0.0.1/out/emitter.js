"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEmitter = void 0;
const fromEvent_1 = __importDefault(require("xstream/extra/fromEvent"));
const events_1 = require("events");
exports.makeEmitter = () => {
    const wsEmitter = new events_1.EventEmitter();
    const emitEvent = (type, data) => {
        wsEmitter.emit(type, data);
    };
    const getEvents = (type) => fromEvent_1.default(wsEmitter, type);
    return { emitEvent, getEvents };
};
//# sourceMappingURL=emitter.js.map