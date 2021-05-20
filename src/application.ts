import express from 'express';
import cors from 'cors';
import {Server, Socket} from "socket.io";
import {Component, GridAsyncSocket} from "Grid";
import {buildBackend} from "./utils/backend";
import {buildEvents} from "./utils/events";
import {buildAuthorsComponent} from "./components/authors";
import {buildLockingComponent} from "./components/locking";
import {buildPingComponent} from "./components/ping";

const app = express();
const httpServer = require('http').Server(app);
const io: Server = require('socket.io')(httpServer, {
    cookie: false,
    cors: {
        origin: "*",
    }
});
app.use(cors());


// ---------------------------------------------------------------
// build application components
// ---------------------------------------------------------------
const events = buildEvents();
const backend = buildBackend();
const components: Component[] = [
    buildAuthorsComponent(backend, events),
    buildLockingComponent(backend, events),
    buildPingComponent(),
]

// ---------------------------------------------------------------
// incoming connections
// ---------------------------------------------------------------
io.on("connection", async (socket: Socket) => {
    backend.add(socket as GridAsyncSocket);
    console.debug("connect - backend sockets:", backend.sockets().length);
    components.forEach((c)=>{
        c.onConnect(socket as GridAsyncSocket);
    });
    socket.on("disconnect", () => {
        console.debug("disconnecting socket: "+socket.id);
        backend.remove(socket as GridAsyncSocket);
        for(let i = components.length-1; i >= 0; i--){
            components[i].onDisconnect(socket as GridAsyncSocket);
        }
        console.debug("disconnect - backend sockets:", backend.sockets().length);
    });
});

const port = process.env.PORT || 3000;

httpServer.listen(port, ()=>{
    console.debug("Started on port "+port);
});
