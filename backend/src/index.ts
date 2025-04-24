import express from 'express'
import cors from 'cors'
//import prisma from '../backend/db/client';
import roomsRouter from './routes/rooms';
import snapshotsRouter from './routes/snapshots';
import eventsRouter from "./routes/events";
import registerCanvasHandlers from "./sockets/canvas"
import { setupRedisAdapter } from './config/redisAdapter';
import http from 'http';
import {Server as SocketIOServer} from "socket.io"
const app= express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
app.use("/rooms", roomsRouter)
app.use('/rooms/:code/snapshot', snapshotsRouter)
app.use('/rooms/:code/events', eventsRouter)

const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });
  setupRedisAdapter(io).then( ()=> {
    registerCanvasHandlers(io);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } )

  .catch((err) => {
    console.error('Failed to connect Redis adapter:', err);
    process.exit(1);
  });
