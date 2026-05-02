import { useEffect, useState } from 'react';
import { Bot, Copy, Plus, Trash2, CheckCircle } from 'lucide-react';
import { api, McpServer, McpTemplate } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Header } from '../components/dashboard/Header';

export function McpConfig() {
  const { toast } = useToast();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [template, setTemplate] = useState<McpTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [form, setForm] = useState({ name: '', config: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([api.getMcpServers(), api.getMcpTemplate(), api.getSettings()])
      .then(([s, t, settings]) => {
        setServers(s.servers);
        setTemplate(t);
        const raw = settings.settings['kie_api_key'];
        setApiKeyValue(raw && !raw.startsWith('***') ? raw : '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast('success', 'Copied!'));

  const getConfigJson = () => {
    if (!template) return '';
    const cfg = JSON.parse(JSON.stringify(template.claude_desktop_config)) as { mcpServers?: { 'kie-ai'?: { env?: Record<string, string> } } };
    if (apiKeyValue && cfg.mcpServers?.['kie-ai']?.env) {
      cfg.mcpServers['kie-ai'].env['KIE_AI_API_KEY'] = apiKeyValue;
    }
    return JSON.stringify(cfg, null, 2);
  };

  const createServer = async () => {
    if (!form.name.trim() || !form.config.trim()) { toast('error', 'Name and config are required'); return; }
    setCreating(true);
    try {
      const config = JSON.parse(form.config) as unknown;
      await api.createMcpServer(form.name, config);
      const s = await api.getMcpServers();
      setServers(s.servers);
      setShowModal(false);
      setForm({ name: '', config: '' });
      toast('success', 'MCP server saved');
    } catch (e) {
      toast('error', e instanceof SyntaxError ? 'Invalid JSON config' : (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const deleteServer = async (id: string) => {
    try {
      await api.deleteMcpServer(id);
      setServers(s => s.filter(x => x.id !== id));
      toast('success', 'Server deleted');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="MCP Configuration" />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Quick setup */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-brand-400" />
                <h2 className="font-semibold">Claude Desktop Quick Setup</h2>
              </div>
              <p className="text-sm text-gray-400">
                Copy this config into your Claude Desktop <code className="text-brand-300">claude_desktop_config.json</code>
              </p>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Your KIE API Key (pre-fill in config)</label>
                <input type="password" className="input" placeholder="sk-..." value={apiKeyValue}
                  onChange={e => setApiKeyValue(e.target.value)} />
              </div>

              <div className="relative">
                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-64">
                  {getConfigJson()}
                </pre>
                <button onClick={() => copy(getConfigJson())}
                  className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors">
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Installation steps */}
            {template && (
              <div className="card space-y-3">
                <h2 className="font-semibold">Installation Steps</h2>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <CheckCircle size={16} className="text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-200 font-medium">Install Node.js 18+</p>
                      <p className="text-gray-500">Required to run the MCP server</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle size={16} className="text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-200 font-medium">Open Claude Desktop config file</p>
                      <div className="mt-1 space-y-1">
                        {Object.entries(template.claude_desktop_path).map(([os, p]) => (
                          <div key={os} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-14 capitalize">{os}:</span>
                            <code className="text-xs text-gray-300 bg-gray-800 px-2 py-0.5 rounded">{p}</code>
                            <button onClick={() => copy(p)} className="text-gray-500 hover:text-gray-300"><Copy size={11} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle size={16} className="text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-200 font-medium">Paste the config above and restart Claude Desktop</p>
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {/* MCP Capabilities */}
            {template && (
              <div className="card space-y-3">
                <h2 className="font-semibold">MCP Capabilities</h2>
                <ul className="space-y-2">
                  {template.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-brand-400 mt-0.5">•</span>{cap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Saved servers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Saved MCP Configurations</h2>
                <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Config
                </button>
              </div>
              {servers.length === 0 ? (
                <div className="card text-center py-8 text-gray-500 text-sm">No saved configurations yet.</div>
              ) : servers.map(s => (
                <div key={s.id} className="card flex items-start gap-4">
                  <Bot size={16} className="text-gray-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-200">{s.name}</p>
                    <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">{JSON.stringify(JSON.parse(s.config), null, 2).slice(0, 200)}...</pre>
                  </div>
                  <button onClick={() => deleteServer(s.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal title="Add MCP Config" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Name</label>
              <input className="input" placeholder="My MCP Config" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Config JSON</label>
              <textarea className="input font-mono text-xs resize-none" rows={10}
                placeholder={`{\n  "command": "npx",\n  "args": ["-y", "@felores/kie-ai-mcp-server"],\n  "env": { "KIE_AI_API_KEY": "your-key" }\n}`}
                value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} />
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={createServer} disabled={creating}>
              {creating ? <Spinner size="sm" /> : <Plus size={15} />}
              Save Config
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
