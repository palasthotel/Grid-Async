import {Events} from "Grid";
import EventEmitter from "events";

export const buildEvents = (): Events => {
    const events = new EventEmitter();
    return {
        emitAuthorJoined(socket){
            events.emit("author.joined", socket);
        },
        onAuthorJoined(cb){
            events.on("author.joined", cb);
        },
        emitAuthorLeft(socket){
            events.emit("author.left", socket);
        },
        onAuthorLeft(cb){
            events.on("author.left", cb);
        }
    }
}