"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPingComponent = void 0;
const buildPingComponent = () => {
    return {
        onConnect(socket) {
            const ping = buildPing(socket);
            socket.ping = ping;
            ping.start();
        },
        onDisconnect(socket) {
            socket.ping.stop();
        }
    };
};
exports.buildPingComponent = buildPingComponent;
const buildPing = (socket) => {
    let _countdown = null;
    let _sendtimer = null;
    function clearTimeouts() {
        if (_countdown) {
            clearTimeout(_countdown);
        }
        if (_sendtimer) {
            clearTimeout(_sendtimer);
        }
    }
    function send() {
        console.debug("send ping", socket.id);
        socket.emit('ping.send');
        //clearTimeouts();
        //_countdown = setTimeout(lost,5000);
    }
    function lost() {
        console.debug("lost");
        clearTimeouts();
        if (socket.connected)
            socket.disconnect();
    }
    socket.on("ping.received", () => {
        console.debug("receive ping");
        clearTimeouts();
        _sendtimer = setTimeout(send, 4000);
    });
    return {
        start() {
            send();
        },
        stop() {
            clearTimeouts();
        }
    };
};
//# sourceMappingURL=ping.js.map