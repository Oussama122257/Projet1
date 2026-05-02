import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { ApiKey } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  const keys = db.prepare('SELECT id, name, key, created_at, last_used, is_active FROM api_keys ORDER BY created_at DESC').all() as ApiKey[];
  const masked = keys.map(k => ({ ...k, key: k.key.substring(0, 8) + '...' + k.key.slice(-4) }));
  res.json({ keys: masked });
});

router.post('/', (req, res) => {
  const { name } = req.body as { name: string };
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const id = uuidv4();
  const key = 'ksa_' + uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  db.prepare('INSERT INTO api_keys (id, name, key) VALUES (?, ?, ?)').run(id, name, key);
  res.status(201).json({ id, name, key, created_at: Math.floor(Date.now() / 1000) });
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.patch('/:id/activate', (req, res) => {
  db.prepare('UPDATE api_keys SET is_active = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
