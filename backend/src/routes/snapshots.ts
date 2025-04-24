import { Router, Request, Response } from "express";
import prisma from "../db/src/client";

const router = Router({ mergeParams: true });

router.get('/', async (req: Request<{ code: string }>, res: Response): Promise<any> => {
  const { code } = req.params;

  try {
    const snapshot = await prisma.snapshot.findUnique({
      where: {
        roomCode: code,
      },
    });

    if (!snapshot) {
      return res.status(404).json({ error: "No snapshot found" });
    }

    res.json({ lastSeq: snapshot.lastSeq, state: snapshot.state });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error occurred!" });
  }
});

export default router;
