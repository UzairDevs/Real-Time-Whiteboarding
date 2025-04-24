// src/sockets/canvas.ts
import { Server, Socket } from 'socket.io';
import prisma from '../db/src/client'

export default function registerCanvasHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-room', async ({ roomCode, userId }) => {
      try {
        const room = await prisma.room.findUnique({
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
      } catch (err) {
        console.error('Join room error:', err);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('canvas: event', async (event) => {
      const { roomCode, senderId, eventId, type, shape, shapeId, payload } = event;

      try {
        const room = await prisma.room.findUnique({
          where: { code: roomCode },
          select: { allowDraw: true, recording: true, adminId: true },
        });

        if (!room) {
          socket.emit('error', 'Invalid room');
          return;
        }

        // Check permissions
        if (!room.allowDraw && senderId !== room.adminId) {
            console.log("permission denied!")
            return;
        }

        // Record if enabled
        if (room.recording) {
          await prisma.event.create({
            data: {
              id: eventId,
              roomCode,
              type,
              payload: shape ?? { shapeId }, // handle both undo and add
            },
          });
        }

        // Broadcast to everyone else in the room
        console.log("broadcasting the event", event)
        io.to(roomCode).emit('canvas: event', event);
      } catch (err) {
        console.error('Canvas event error:', err);
        socket.emit('error', 'Canvas event failed');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
