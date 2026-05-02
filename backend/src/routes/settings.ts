import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM settings').all() as { key: string; value: string; updated_at: number }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    if (row.key === 'kie_api_key') {
      settings[row.key] = row.value ? '***' + row.value.slice(-4) : '';
    } else {
      settings[row.key] = row.value;
    }
  }
  res.json({ settings });
});

router.post('/', (req, res) => {
  const { key, value } = req.body as { key: string; value: string };
  if (!key || value === undefined) {
    res.status(400).json({ error: 'key and value are required' });
    return;
  }
  db.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()'
  ).run(key, value);
  res.json({ success: true });
});

export default router;
