import { Request, Response, NextFunction } from 'express';
import db from '../db/database';

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const key = db.prepare('SELECT * FROM api_keys WHERE key = ? AND is_active = 1').get(token);

  if (!key) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  db.prepare('UPDATE api_keys SET last_used = unixepoch() WHERE key = ?').run(token);
  next();
}

export function getActiveKieKey(): string {
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'kie_api_key'").get() as { value: string } | undefined;
  return setting?.value || process.env.KIE_API_KEY || '';
}
