// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config();                  // ← load .env before anything else

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import roomsRouter from './routes/rooms';
import snapshotsRouter from './routes/snapshots';
import eventsRouter from './routes/events';
import registerCanvasHandlers from './sockets/canvas';
import { setupRedisAdapter } from './config/redisAdapter';

const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

//–– middleware & routers ––//
app.use(cors());
app.use(express.json());

// health check


app.use('/rooms', roomsRouter);
app.use('/rooms/:code/snapshot', snapshotsRouter);
app.use('/rooms/:code/events', eventsRouter);

//–– socket & redis adapter ––//
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
});

setupRedisAdapter(io)
  .then(() => {
    registerCanvasHandlers(io);
    server.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect Redis adapter:', err);
    process.exit(1);
  });
