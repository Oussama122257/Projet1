import { useEffect, useState } from 'react';
import { Plus, Trash2, Copy, Key } from 'lucide-react';
import { api, ApiKey } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Header } from '../components/dashboard/Header';
import { formatDate } from '../lib/utils';

export function ApiKeys() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try { const r = await api.getApiKeys(); setKeys(r.keys); }
    catch (e) { toast('error', (e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) { toast('error', 'Name is required'); return; }
    setCreating(true);
    try {
      const k = await api.createApiKey(name.trim());
      setNewKey(k);
      setName('');
      setShowModal(false);
      await load();
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await api.deleteApiKey(id);
      setKeys(k => k.filter(x => x.id !== id));
      toast('success', 'API key revoked');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast('success', 'Copied to clipboard'));
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="API Keys" />
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Manage local API keys for accessing this dashboard programmatically.</p>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Key
          </button>
        </div>

        {newKey && (
          <div className="card border-green-700 bg-green-900/20 space-y-2">
            <p className="text-green-300 text-sm font-medium">New API key created — copy it now, it won't be shown again:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-800 px-3 py-2 rounded-lg text-sm text-green-300 break-all">{newKey.key}</code>
              <button onClick={() => copy(newKey.key)} className="btn-secondary text-sm flex items-center gap-1"><Copy size={13} /></button>
            </div>
            <button onClick={() => setNewKey(null)} className="text-xs text-gray-500 hover:text-gray-300">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : keys.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">No API keys yet. Create one to get started.</div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="card flex items-center gap-4">
                <Key size={16} className="text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{k.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{k.key}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Created {formatDate(k.created_at)}
                    {k.last_used ? ` · Last used ${formatDate(k.last_used)}` : ' · Never used'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => deleteKey(k.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Create API Key" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Key Name</label>
              <input className="input" placeholder="My App" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()} autoFocus />
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={create} disabled={creating}>
              {creating ? <Spinner size="sm" /> : <Plus size={15} />}
              Create Key
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
