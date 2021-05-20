import {Backend, GridAsyncSocket} from "Grid";
import {getRoom} from "./room";

export const buildBackend = (): Backend =>{

    let sockets: GridAsyncSocket[] = [];

    return {
        sockets: ()=> sockets,
        add(socket){
            socket.join(`${socket.domain}/${socket.path}`);
            sockets.push(socket);
        },
        remove(socket){
          sockets = sockets.filter(s => s !== socket);
        },
        emit(socket: GridAsyncSocket, event: string, data: any){
            socket.to(getRoom(socket)).emit(event, data);
        },
        getOtherSockets(socket: GridAsyncSocket): GridAsyncSocket[] {
            return sockets.filter(c=>{
                return c !== socket && getRoom(c) === getRoom(socket)
            });
        },
    }
}