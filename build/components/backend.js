"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBackend = void 0;
const room_1 = require("../utils/room");
const buildBackend = () => {
    let sockets = [];
    return {
        sockets: () => sockets,
        add(socket) {
            socket.join(`${socket.domain}/${socket.path}`);
            sockets.push(socket);
        },
        remove(socket) {
            sockets = sockets.filter(s => s !== socket);
        },
        emit(socket, event, data) {
            socket.to(room_1.getRoom(socket)).emit(event, data);
        },
        getOtherSockets(socket) {
            console.debug("getOtherSockets");
            const found = sockets.filter(c => {
                return c !== socket && room_1.getRoom(c) === room_1.getRoom(socket);
            });
            console.debug(found.map(f => f.identifier));
            return found;
        },
    };
};
exports.buildBackend = buildBackend;
//# sourceMappingURL=backend.js.map