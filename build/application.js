"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const backend_1 = require("./utils/backend");
const events_1 = require("./utils/events");
const authors_1 = require("./components/authors");
const locking_1 = require("./components/locking");
const ping_1 = require("./components/ping");
const httpServer = http_1.createServer();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    }
});
// ---------------------------------------------------------------
// build application components
// ---------------------------------------------------------------
const events = events_1.buildEvents();
const backend = backend_1.buildBackend();
const components = [
    authors_1.buildAuthorsComponent(backend, events),
    locking_1.buildLockingComponent(backend, events),
    ping_1.buildPingComponent(),
];
// ---------------------------------------------------------------
// incoming connections
// ---------------------------------------------------------------
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    backend.add(socket);
    console.debug("connect - backend sockets:", backend.sockets().length);
    components.forEach((c) => {
        c.onConnect(socket);
    });
    socket.on("disconnect", () => {
        console.debug("disconnecting socket: " + socket.id);
        backend.remove(socket);
        for (let i = components.length - 1; i >= 0; i--) {
            components[i].onDisconnect(socket);
        }
        console.debug("disconnect - backend sockets:", backend.sockets().length);
    });
}));
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.debug("Started on port " + port);
});
//# sourceMappingURL=application.js.map