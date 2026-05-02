import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { Webhook } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  const webhooks = db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all() as Webhook[];
  res.json({ webhooks });
});

router.post('/', (req, res) => {
  const { url, events, secret } = req.body as { url: string; events: string[]; secret?: string };
  if (!url || !events?.length) { res.status(400).json({ error: 'url and events are required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO webhooks (id, url, events, secret) VALUES (?, ?, ?, ?)').run(id, url, JSON.stringify(events), secret || null);
  res.status(201).json({ id, url, events, secret: secret ? '***' : null });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Receive incoming KIE.ai webhook callbacks
router.post('/callback', (req, res) => {
  const payload = req.body as { taskId?: string; status?: string; resultUrl?: string };
  if (payload.taskId && payload.status) {
    db.prepare(
      'UPDATE tasks SET status = ?, result_url = ?, updated_at = unixepoch() WHERE task_id = ?'
    ).run(payload.status, payload.resultUrl || null, payload.taskId);
  }
  res.json({ received: true });
});

export default router;
