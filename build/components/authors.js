"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthorsComponent = void 0;
const room_1 = require("../utils/room");
const buildAuthorsComponent = (backend, events) => {
    const onAuthorsJoin = (socket, data) => {
        socket.joined = true;
        socket.author = data.author;
        socket.identifier = socket.id;
        socket.domain = data.domain;
        socket.path = data.path;
        socket.identity = data.identity;
        socket.hasLock = false;
        backend.emit(socket, "authors.joined", { author: socket.author, identifier: socket.id });
        const authorsList = backend.getOtherSockets(socket)
            .map(other => ({ author: other.author, identifier: other.identifier }));
        console.debug(authorsList);
        socket.emit("authors.list", authorsList);
        let count = 0;
        backend.getOtherSockets(socket).forEach((other) => {
            if (other.identity === socket.identity) {
                count++;
            }
        });
        if (count >= 1) {
            socket.emit("authors.multiplehits", count + 1);
        }
    };
    return {
        getRoom: room_1.getRoom,
        onConnect(socket) {
            socket.on("authors.join", (data) => {
                onAuthorsJoin(socket, data);
                events.emitAuthorJoined(socket);
            });
        },
        onDisconnect(socket) {
            if (socket.joined) {
                events.emitAuthorLeft(socket);
                backend.emit(socket, "authors.left", socket.identifier);
            }
        }
    };
};
exports.buildAuthorsComponent = buildAuthorsComponent;
//# sourceMappingURL=authors.js.map