
module.exports = {
    router:{
        port: 61100,
        timeout: 1000*2*60,
        socketio: {
            cors: {
                origin: "*",
            }
        }
    },
}; 