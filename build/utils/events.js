"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEvents = void 0;
const events_1 = __importDefault(require("events"));
const buildEvents = () => {
    const events = new events_1.default();
    return {
        emitAuthorJoined(socket) {
            events.emit("author.joined", socket);
        },
        onAuthorJoined(cb) {
            events.on("author.joined", cb);
        },
        emitAuthorLeft(socket) {
            events.emit("author.left", socket);
        },
        onAuthorLeft(cb) {
            events.on("author.left", cb);
        }
    };
};
exports.buildEvents = buildEvents;
//# sourceMappingURL=events.js.map