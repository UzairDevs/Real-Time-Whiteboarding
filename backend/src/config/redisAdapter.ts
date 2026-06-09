// src/config/redisAdapter.ts
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';

/**
 * Wire up the socket.io Redis adapter so events fan out across multiple
 * backend instances. The URL comes from REDIS_URL (e.g. Render Key Value /
 * a local docker redis on redis://localhost:6379).
 *
 * Throws if it cannot connect — the caller decides whether that's fatal.
 */
export async function setupRedisAdapter(io: Server, url: string) {
  const pubClient = createClient({ url });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  console.log('Redis adapter connected');
}
