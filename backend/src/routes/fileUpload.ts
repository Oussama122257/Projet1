import { Router, Request, Response } from 'express';
import { getActiveKieKey } from '../middleware/auth';

const router = Router();

// KIE File Upload API uses a different base domain
const FILE_UPLOAD_BASE = 'https://kieai.redpandaai.co';
const FILE_UPLOAD_BASE2 = 'https://kieai.redpandaapi.co';

function getHeaders() {
  const apiKey = getActiveKieKey();
  if (!apiKey) throw new Error('KIE API key not configured. Go to Settings to add your KIE API key.');
  return { Authorization: `Bearer ${apiKey}` };
}

// --- URL Upload ---
router.post('/url', async (req: Request, res: Response) => {
  const { fileUrl, uploadPath, fileName } = req.body as { fileUrl: string; uploadPath?: string; fileName?: string };
  if (!fileUrl) { res.status(400).json({ error: 'fileUrl is required' }); return; }
  try {
    const headers = getHeaders();
    const body: Record<string, string> = { fileUrl };
    if (uploadPath) body.uploadPath = uploadPath;
    if (fileName) body.fileName = fileName;

    const r = await fetch(`${FILE_UPLOAD_BASE}/api/file-url-upload`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json() as unknown;
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- Base64 Upload ---
router.post('/base64', async (req: Request, res: Response) => {
  const { base64Data, uploadPath, fileName } = req.body as { base64Data: string; uploadPath?: string; fileName?: string };
  if (!base64Data) { res.status(400).json({ error: 'base64Data is required' }); return; }
  try {
    const headers = getHeaders();
    const body: Record<string, string> = { base64Data };
    if (uploadPath) body.uploadPath = uploadPath;
    if (fileName) body.fileName = fileName;

    const r = await fetch(`${FILE_UPLOAD_BASE2}/api/file-base64-upload`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json() as unknown;
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- Stream Upload (multipart proxy) ---
// We forward the raw multipart body from the client to KIE
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const headers = getHeaders();
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
      return;
    }

    // Collect the raw body chunks and forward them
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    await new Promise<void>((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });
    const rawBody = Buffer.concat(chunks);

    const r = await fetch(`${FILE_UPLOAD_BASE2}/api/file-stream-upload`, {
      method: 'POST',
      headers: { ...headers, 'content-type': contentType },
      body: rawBody,
    });
    const data = await r.json() as unknown;
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
