import {Component, GridAsyncSocket, Ping, PingSocket} from "Grid";


export const buildPingComponent = (): Component =>{
    return {
        onConnect(socket){
            const ping = buildPing(socket);
            (socket as PingSocket).ping = ping;
            ping.start();
        },
        onDisconnect(socket){
            (socket as PingSocket).ping.stop();
        }
    }
}

const buildPing = (socket: GridAsyncSocket): Ping => {

    let _countdown: NodeJS.Timeout|null = null;
    let _sendtimer: NodeJS.Timeout|null = null;
    function clearTimeouts(){
        if (_countdown) {
            clearTimeout(_countdown);
        }
        if (_sendtimer) {
            clearTimeout(_sendtimer);
        }
    }

    function send(){
        console.debug("send ping", socket.id);
        socket.emit('ping.send',1);
        //clearTimeouts();
        //_countdown = setTimeout(lost,5000);
    }

    function lost(){
        console.debug("lost");
        clearTimeouts();
        if(socket.connected)socket.disconnect();
    }

    socket.on("ping.received", ()=>{
        console.debug("receive ping");
        clearTimeouts();
        _sendtimer = setTimeout(send,4000);
    });

    return {
        start() {
            send();
        },
        stop(){
            clearTimeouts();
        }
    }
}