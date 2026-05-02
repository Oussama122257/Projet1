import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import settingsRouter from './routes/settings';
import apiKeysRouter from './routes/apiKeys';
import kieRouter from './routes/kie';
import tasksRouter from './routes/tasks';
import mcpRouter from './routes/mcp';
import webhooksRouter from './routes/webhooks';
import fileUploadRouter from './routes/fileUpload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

app.use('/api/settings', settingsRouter);
app.use('/api/api-keys', apiKeysRouter);
app.use('/api/kie', kieRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/files', fileUploadRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`KIE SaaS Backend running on http://localhost:${PORT}`);
});

export default app;
