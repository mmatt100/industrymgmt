import { Router } from 'express';
import { getDb } from '../../lib/db';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  try {
    getDb().prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
  }
});

export default healthRouter;
