"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoom = void 0;
const getRoom = (socket) => `${socket.domain}/${socket.path}`;
exports.getRoom = getRoom;
//# sourceMappingURL=room.js.map