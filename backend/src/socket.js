"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // En producción esto debe restringirse
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });
    io.on('connection', (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io no está inicializado');
    }
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map