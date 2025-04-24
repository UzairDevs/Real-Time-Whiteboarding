import { Router } from 'express';
import prisma from '../db/src/client';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
    const code = (req.params as { code: string }).code;
  const since = parseInt(req.query.since as string) || 0;
  try {
    const events = await prisma.event.findMany({
      where: { roomCode: code, sequenceNo: { gt: since } },
      orderBy: { sequenceNo: 'asc' },
      select: { sequenceNo: true, type: true, payload: true, timestamp: true }
    });
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch events' });
  }
});

export default router;