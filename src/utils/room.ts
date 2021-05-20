import {GridAsyncSocket} from "Grid";

export const getRoom = (socket: GridAsyncSocket) => `${socket.domain}/${socket.path}`;