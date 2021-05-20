import {Socket} from "socket.io";

type Events = {
    emitAuthorJoined: (socket: GridAsyncSocket) => void
    onAuthorJoined: (cb: (socket: GridAsyncSocket) => void) => void
    emitAuthorLeft: (socket: GridAsyncSocket) => void
    onAuthorLeft: (cb: (socket: GridAsyncSocket) => void) => void
}

type Backend = {
    sockets: ()=> GridAsyncSocket[]
    add: (socket: GridAsyncSocket) => void
    remove: (socket: GridAsyncSocket) => void
    emit: (socket: GridAsyncSocket, event: string, data:any) => void
    getOtherSockets: (socket: GridAsyncSocket) => GridAsyncSocket[]
}

interface Component {
    onConnect: (socket: GridAsyncSocket)=> void
    onDisconnect: (socket: GridAsyncSocket)=>void
}

interface GridAsyncSocket extends Socket {
    joined: boolean
    author: string
    identifier: string
    domain: string
    path: string
    identity: string
    hasLock: boolean
}

interface AuthorsComponent extends Component {
    getRoom: (socket: GridAsyncSocket) => string
}

type Ping = {
    start: ()=> void
    stop: ()=> void
}

interface PingSocket extends GridAsyncSocket {
    ping: Ping
}