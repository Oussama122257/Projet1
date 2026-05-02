import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { getActiveKieKey } from '../middleware/auth';
import { VideoGenerateRequest, ImageGenerateRequest, MusicGenerateRequest } from '../types';

const router = Router();
const KIE_BASE = 'https://api.kie.ai';

async function kieRequest(path: string, method: string, body?: unknown) {
  const apiKey = getActiveKieKey();
  if (!apiKey) throw new Error('KIE API key not configured. Go to Settings to add your KIE API key.');

  const res = await fetch(`${KIE_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error((data.msg as string) || 'KIE API request failed');
  return data;
}

function saveTask(type: string, model: string, params: unknown) {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO tasks (id, type, model, status, input_params, created_at, updated_at) VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())'
  ).run(id, type, model, 'pending', JSON.stringify(params));
  return id;
}

function updateTask(localId: string, taskId: string | null, status: string, extra?: { result_url?: string; error_message?: string; credits_used?: number }) {
  db.prepare(
    'UPDATE tasks SET task_id = ?, status = ?, result_url = ?, error_message = ?, credits_used = ?, updated_at = unixepoch() WHERE id = ?'
  ).run(taskId, status, extra?.result_url || null, extra?.error_message || null, extra?.credits_used || null, localId);
}

// Credit balance
router.get('/credit', async (_req, res: Response) => {
  try {
    const data = await kieRequest('/api/v1/chat/credit', 'GET');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- VIDEO ---
router.post('/video/generate', async (req: Request, res: Response) => {
  const { prompt, model = 'veo3_fast', aspectRatio = '16:9', duration = 8, imageUrl, callbackUrl } = req.body as VideoGenerateRequest;
  if (!prompt) { res.status(400).json({ error: 'prompt is required' }); return; }

  const localId = saveTask('video', model, req.body);
  try {
    const payload: Record<string, unknown> = { prompt, model, aspectRatio, duration };
    if (imageUrl) payload.imageUrl = imageUrl;
    if (callbackUrl) payload.callbackUrl = callbackUrl;

    const data = await kieRequest('/api/v1/veo/generate', 'POST', payload) as { data?: { taskId?: string } };
    const taskId = data?.data?.taskId || null;
    updateTask(localId, taskId, 'generating');
    res.json({ localId, taskId, status: 'generating', ...data });
  } catch (err) {
    updateTask(localId, null, 'failed', { error_message: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/video/status/:taskId', async (req: Request, res: Response) => {
  try {
    const data = await kieRequest(`/api/v1/veo/record-info?taskId=${req.params.taskId}`, 'GET') as { data?: { status?: string; resultUrl?: string } };
    const status = data?.data?.status;
    const resultUrl = data?.data?.resultUrl;
    if (status === 'success' || status === 'fail') {
      db.prepare(
        'UPDATE tasks SET status = ?, result_url = ?, updated_at = unixepoch() WHERE task_id = ?'
      ).run(status, resultUrl || null, req.params.taskId);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- IMAGE ---
router.post('/image/generate', async (req: Request, res: Response) => {
  const { prompt, model = 'flux-kontext-pro', aspectRatio = '1:1', imageUrl, callbackUrl } = req.body as ImageGenerateRequest;
  if (!prompt) { res.status(400).json({ error: 'prompt is required' }); return; }

  const localId = saveTask('image', model, req.body);
  try {
    const payload: Record<string, unknown> = { prompt, model, aspectRatio };
    if (imageUrl) payload.imageUrl = imageUrl;
    if (callbackUrl) payload.callbackUrl = callbackUrl;

    const endpoint = imageUrl ? '/api/v1/flux-kontext/edit' : '/api/v1/flux-kontext/generate';
    const data = await kieRequest(endpoint, 'POST', payload) as { data?: { taskId?: string } };
    const taskId = data?.data?.taskId || null;
    updateTask(localId, taskId, 'generating');
    res.json({ localId, taskId, status: 'generating', ...data });
  } catch (err) {
    updateTask(localId, null, 'failed', { error_message: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- MUSIC ---
router.post('/music/generate', async (req: Request, res: Response) => {
  const { prompt, model = 'V4', customMode = false, title, tags, instrumental = false, callbackUrl } = req.body as MusicGenerateRequest;
  if (!prompt) { res.status(400).json({ error: 'prompt is required' }); return; }

  const localId = saveTask('music', `suno-${model}`, req.body);
  try {
    const payload: Record<string, unknown> = { prompt, mv: model, customMode, make_instrumental: instrumental };
    if (title) payload.title = title;
    if (tags) payload.tags = tags;
    if (callbackUrl) payload.callbackUrl = callbackUrl;

    const data = await kieRequest('/api/v1/generate', 'POST', payload) as { data?: { taskId?: string } };
    const taskId = data?.data?.taskId || null;
    updateTask(localId, taskId, 'generating');
    res.json({ localId, taskId, status: 'generating', ...data });
  } catch (err) {
    updateTask(localId, null, 'failed', { error_message: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- TASK STATUS (generic) ---
router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const data = await kieRequest(`/api/v1/jobs/recordInfo?taskId=${req.params.taskId}`, 'GET') as { data?: { status?: string; resultUrl?: string } };
    const status = data?.data?.status;
    const resultUrl = data?.data?.resultUrl;
    if (status) {
      db.prepare(
        'UPDATE tasks SET status = ?, result_url = ?, updated_at = unixepoch() WHERE task_id = ?'
      ).run(status, resultUrl || null, req.params.taskId);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- DOWNLOAD URL ---
router.post('/download-url', async (req: Request, res: Response) => {
  const { resourceUrl } = req.body as { resourceUrl: string };
  if (!resourceUrl) { res.status(400).json({ error: 'resourceUrl is required' }); return; }
  try {
    const data = await kieRequest('/api/v1/common/download-url', 'POST', { resourceUrl });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
