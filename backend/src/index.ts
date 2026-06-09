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

// Comma-separated list of allowed origins, or "*" for any (default).
// e.g. CORS_ORIGIN="https://whiteboard-frontend.onrender.com"
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const corsOrigins =
  CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((s) => s.trim());

const app = express();
const server = http.createServer(app);

//–– middleware & routers ––//
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// health check (used by Render's health checks + uptime pings)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (_req, res) => {
  res.status(200).send('Whiteboard backend is running');
});

app.use('/rooms', roomsRouter);
app.use('/rooms/:code/snapshot', snapshotsRouter);
app.use('/rooms/:code/events', eventsRouter);

//–– socket & redis adapter ––//
const io = new SocketIOServer(server, {
  cors: { origin: corsOrigins, methods: ['GET', 'POST'] },
});

async function start() {
  const redisUrl = process.env.REDIS_URL;

  // The Redis adapter is optional: it lets multiple backend instances share
  // socket events. If it's not configured or unreachable we log and continue
  // with a single instance rather than crashing the whole server.
  if (redisUrl) {
    try {
      await setupRedisAdapter(io, redisUrl);
    } catch (err) {
      console.error(
        'Redis adapter failed to connect — continuing without it (single instance):',
        err
      );
    }
  } else {
    console.log('No REDIS_URL set — running without the Redis adapter.');
  }

  registerCanvasHandlers(io);

  server.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

start();
