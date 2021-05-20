"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLockingComponent = void 0;
const buildLockingComponent = (backend, events) => {
    events.onAuthorJoined((socket) => {
        console.debug("locking->onAuthorJoined");
        console.debug(backend.getOtherSockets(socket).map(o => ({ hasLock: o.hasLock, id: o.identifier })));
        const locker = backend.getOtherSockets(socket).find(other => other.hasLock);
        if (typeof locker !== "undefined") {
            console.debug("isLocked");
            socket.emit("locking.isLocked", { isLocked: true, identifier: locker.identifier });
        }
        else {
            console.debug("hasLock");
            socket.hasLock = true;
            socket.emit("locking.isLocked", { isLocked: false });
        }
    });
    return {
        onConnect(socket) {
            socket.hasLock = false;
            socket.on("locking.requestLock", () => {
                backend.getOtherSockets(socket).forEach((other) => {
                    if (other.hasLock) {
                        other.emit("locking.lockRequested", { identifier: socket.identifier });
                    }
                });
            });
            socket.on("locking.handover", (data) => {
                backend.getOtherSockets(socket).forEach(other => {
                    if (other.identifier === data) {
                        socket.hasLock = false;
                        other.hasLock = true;
                        backend.emit(socket, "locking.isLocked", { isLocked: true, identifier: other.identifier });
                        socket.emit("locking.isLocked", { isLocked: false });
                    }
                });
            });
            socket.on("locking.denyHandover", data => {
                if (!socket.hasLock)
                    return;
                backend.getOtherSockets(socket).forEach(other => {
                    if (other.identifier === data) {
                        other.emit("locking.isLocked", { isLocked: true, identifier: socket.identifier });
                    }
                });
            });
        },
        onDisconnect(socket) {
            if (socket.hasLock) {
                let hit = null;
                console.debug(backend.getOtherSockets(socket).map(s => ({ hasLock: s.hasLock, id: s.identifier })));
                backend.getOtherSockets(socket).forEach(other => {
                    if (hit === null) {
                        hit = other;
                        other.hasLock = true;
                        other.emit("locking.isLocked", { isLocked: false });
                    }
                    else {
                        other.emit("locking.isLocked", { isLocked: true, identifier: hit.identifier });
                    }
                });
                console.debug(backend.getOtherSockets(socket).map(s => ({ hasLock: s.hasLock, id: s.identifier })));
            }
        }
    };
};
exports.buildLockingComponent = buildLockingComponent;
//# sourceMappingURL=locking.js.map