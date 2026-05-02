import { Router } from 'express';
import db from '../db/database';
import { Task } from '../types';

const router = Router();

router.get('/', (req, res) => {
  const { type, status, limit = '50', offset = '0' } = req.query as Record<string, string>;
  let query = 'SELECT * FROM tasks';
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  if (type) { conditions.push('type = ?'); params.push(type); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const tasks = db.prepare(query).all(...params) as Task[];
  const total = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;
  res.json({ tasks, total });
});

router.get('/stats', (_req, res) => {
  const stats = {
    total: (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c,
    by_type: db.prepare('SELECT type, COUNT(*) as count FROM tasks GROUP BY type').all(),
    by_status: db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status').all(),
    credits_used: (db.prepare('SELECT COALESCE(SUM(credits_used), 0) as total FROM tasks WHERE status = "success"').get() as { total: number }).total,
  };
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? OR task_id = ?').get(req.params.id, req.params.id) as Task | undefined;
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(task);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
