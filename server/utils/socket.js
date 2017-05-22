const Socket = require('socket.io');


exports.register = function(server, options, next) {
    let io = Socket(server.select('api').listener);
    io.on('connection', (socket) => {});
    next();
};

exports.register.attributes = {
    name: 'socket'
};