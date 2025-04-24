"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerCanvasHandlers;
const client_1 = __importDefault(require("../db/src/client"));
function registerCanvasHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        socket.on('join-room', (_a) => __awaiter(this, [_a], void 0, function* ({ roomCode, userId }) {
            try {
                const room = yield client_1.default.room.findUnique({
                    where: { code: roomCode },
                    select: { allowDraw: true, recording: true, adminId: true },
                });
                if (!room) {
                    socket.emit('error', 'Room Not Found');
                    return;
                }
                socket.join(roomCode);
                socket.data.roomCode = roomCode;
                socket.data.userId = userId;
                console.log(`User ${userId} joined room ${roomCode}`);
                socket.emit('room-config', room);
                // TODO: emit snapshot + historical events if recording was enabled
            }
            catch (err) {
                console.error('Join room error:', err);
                socket.emit('error', 'Failed to join room');
            }
        }));
        socket.on('canvas: event', (event) => __awaiter(this, void 0, void 0, function* () {
            const { roomCode, senderId, eventId, type, shape, shapeId, payload } = event;
            try {
                const room = yield client_1.default.room.findUnique({
                    where: { code: roomCode },
                    select: { allowDraw: true, recording: true, adminId: true },
                });
                if (!room) {
                    socket.emit('error', 'Invalid room');
                    return;
                }
                // Check permissions
                if (!room.allowDraw && senderId !== room.adminId) {
                    console.log("permission denied!");
                    return;
                }
                // Record if enabled
                if (room.recording) {
                    yield client_1.default.event.create({
                        data: {
                            id: eventId,
                            roomCode,
                            type,
                            payload: shape !== null && shape !== void 0 ? shape : { shapeId }, // handle both undo and add
                        },
                    });
                }
                // Broadcast to everyone else in the room
                console.log("broadcasting the event", event);
                io.to(roomCode).emit('canvas: event', event);
            }
            catch (err) {
                console.error('Canvas event error:', err);
                socket.emit('error', 'Canvas event failed');
            }
        }));
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}
