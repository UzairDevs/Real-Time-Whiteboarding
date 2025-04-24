"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
//import prisma from '../backend/db/client';
const rooms_1 = __importDefault(require("./routes/rooms"));
const snapshots_1 = __importDefault(require("./routes/snapshots"));
const events_1 = __importDefault(require("./routes/events"));
const canvas_1 = __importDefault(require("./sockets/canvas"));
const redisAdapter_1 = require("./config/redisAdapter");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/rooms", rooms_1.default);
app.use('/rooms/:code/snapshot', snapshots_1.default);
app.use('/rooms/:code/events', events_1.default);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
(0, redisAdapter_1.setupRedisAdapter)(io).then(() => {
    (0, canvas_1.default)(io);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
})
    .catch((err) => {
    console.error('Failed to connect Redis adapter:', err);
    process.exit(1);
});
