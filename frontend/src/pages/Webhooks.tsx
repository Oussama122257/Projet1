import { useEffect, useState } from 'react';
import { Plus, Trash2, Webhook } from 'lucide-react';
import { api, Webhook as WebhookType } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Header } from '../components/dashboard/Header';
import { formatDate } from '../lib/utils';

const EVENT_OPTIONS = ['task.completed', 'task.failed', 'video.ready', 'image.ready', 'music.ready'];

export function Webhooks() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ url: '', secret: '', events: [] as string[] });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try { const r = await api.getWebhooks(); setWebhooks(r.webhooks); }
    catch (e) { toast('error', (e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.url.trim() || !form.events.length) { toast('error', 'URL and at least one event are required'); return; }
    setCreating(true);
    try {
      await api.createWebhook(form.url, form.events, form.secret || undefined);
      await load();
      setShowModal(false);
      setForm({ url: '', secret: '', events: [] });
      toast('success', 'Webhook created');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const toggle = (ev: string) => setForm(f => ({
    ...f,
    events: f.events.includes(ev) ? f.events.filter(x => x !== ev) : [...f.events, ev],
  }));

  const deleteWebhook = async (id: string) => {
    try {
      await api.deleteWebhook(id);
      setWebhooks(w => w.filter(x => x.id !== id));
      toast('success', 'Webhook deleted');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Webhooks" />
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Receive callbacks when KIE.ai tasks complete.</p>
            <p className="text-xs text-gray-500 mt-0.5">KIE.ai callback endpoint: <code className="text-brand-400">POST /api/webhooks/callback</code></p>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Webhook
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : webhooks.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">No webhooks configured yet.</div>
        ) : (
          <div className="space-y-2">
            {webhooks.map(w => {
              const events = JSON.parse(w.events) as string[];
              return (
                <div key={w.id} className="card flex items-start gap-4">
                  <Webhook size={16} className="text-gray-500 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 break-all">{w.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {events.map(e => (
                        <span key={e} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Created {formatDate(w.created_at)}</p>
                  </div>
                  <button onClick={() => deleteWebhook(w.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Add Webhook" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Endpoint URL *</label>
              <input type="url" className="input" placeholder="https://your-server.com/webhook"
                value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Events *</label>
              <div className="space-y-2">
                {EVENT_OPTIONS.map(ev => (
                  <label key={ev} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded" checked={form.events.includes(ev)}
                      onChange={() => toggle(ev)} />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Secret (optional)</label>
              <input type="password" className="input" placeholder="Webhook signing secret"
                value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} />
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={create} disabled={creating}>
              {creating ? <Spinner size="sm" /> : <Plus size={15} />}
              Create Webhook
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
