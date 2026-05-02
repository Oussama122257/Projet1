import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { McpServer } from '../types';

const router = Router();

const DEFAULT_MCP_CONFIG = {
  name: 'kie-ai-mcp',
  description: 'KIE.ai MCP Server for Claude Desktop',
  command: 'npx',
  args: ['-y', '@felores/kie-ai-mcp-server'],
  env: { KIE_AI_API_KEY: '<YOUR_KIE_API_KEY>' },
};

router.get('/', (_req, res) => {
  const servers = db.prepare('SELECT * FROM mcp_servers ORDER BY created_at DESC').all() as McpServer[];
  res.json({ servers });
});

router.get('/template', (_req, res) => {
  res.json({
    claude_desktop_config: {
      mcpServers: {
        'kie-ai': DEFAULT_MCP_CONFIG,
      },
    },
    installation: {
      npm: 'npm install -g @felores/kie-ai-mcp-server',
      npx: 'npx @felores/kie-ai-mcp-server',
      env_var: 'KIE_AI_API_KEY=your_key_here',
    },
    capabilities: [
      'Image generation (text-to-image via Nano Banana)',
      'Image editing (natural language, up to 5 images)',
      'Video creation (Veo3 text-to-video and image-to-video)',
      'Video enhancement (1080p upscaling)',
      'Task tracking via SQLite',
    ],
    claude_desktop_path: {
      mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
      linux: '~/.config/Claude/claude_desktop_config.json',
    },
  });
});

router.post('/', (req, res) => {
  const { name, config } = req.body as { name: string; config: unknown };
  if (!name || !config) { res.status(400).json({ error: 'name and config are required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO mcp_servers (id, name, config) VALUES (?, ?, ?)').run(id, name, JSON.stringify(config));
  res.status(201).json({ id, name, config, created_at: Math.floor(Date.now() / 1000) });
});

router.patch('/:id', (req, res) => {
  const { name, config, is_active } = req.body as { name?: string; config?: unknown; is_active?: number };
  const server = db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(req.params.id) as McpServer | undefined;
  if (!server) { res.status(404).json({ error: 'MCP server not found' }); return; }

  db.prepare(
    'UPDATE mcp_servers SET name = ?, config = ?, is_active = ? WHERE id = ?'
  ).run(
    name ?? server.name,
    config ? JSON.stringify(config) : server.config,
    is_active ?? server.is_active,
    req.params.id
  );
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM mcp_servers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
