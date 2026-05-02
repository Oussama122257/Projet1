import { useState } from 'react';
import { Music, Send, RefreshCw } from 'lucide-react';
import { api, TaskResult } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/dashboard/Header';
import { statusBadgeClass } from '../lib/utils';

const MODELS = ['V3.5', 'V4', 'V4.5', 'V4.5_Plus', 'V5', 'V5.5'];

export function MusicGen() {
  const { toast } = useToast();
  const [form, setForm] = useState({ prompt: '', model: 'V4', customMode: false, title: '', tags: '', instrumental: false });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(TaskResult & { taskId: string | null }) | null>(null);
  const [polling, setPolling] = useState(false);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);

  const generate = async () => {
    if (!form.prompt.trim()) { toast('error', 'Prompt/lyrics are required'); return; }
    setLoading(true); setResult(null); setStatusData(null);
    try {
      const res = await api.generateMusic({
        prompt: form.prompt,
        model: form.model,
        customMode: form.customMode,
        title: form.title || undefined,
        tags: form.tags || undefined,
        instrumental: form.instrumental,
      }) as TaskResult & { taskId: string | null };
      setResult(res);
      toast('success', 'Music generation started!');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!result?.taskId) return;
    setPolling(true);
    try {
      const data = await api.getTaskStatus(result.taskId) as Record<string, unknown>;
      setStatusData(data);
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setPolling(false);
    }
  };

  const status = (statusData as { data?: { status?: string } } | null)?.data?.status;
  const audioUrls = (statusData as { data?: { audio_url?: string; stream_audio_url?: string } } | null)?.data;

  return (
    <div className="flex flex-col h-full">
      <Header title="Music Generation (Suno)" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-5">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Music size={18} className="text-green-400" />
              <h2 className="font-semibold">Generate Music</h2>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{form.customMode ? 'Lyrics' : 'Music Description'} *</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder={form.customMode ? '[Verse]\nWalking through the digital rain...' : 'An upbeat electronic pop song about the future of AI...'}
                value={form.prompt}
                onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.customMode}
                  onChange={e => setForm(f => ({ ...f, customMode: e.target.checked }))} />
                Custom Mode (with lyrics)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.instrumental}
                  onChange={e => setForm(f => ({ ...f, instrumental: e.target.checked }))} />
                Instrumental
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Model</label>
              <select className="select" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}>
                {MODELS.map(m => <option key={m} value={m}>Suno {m}</option>)}
              </select>
            </div>

            {form.customMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Title</label>
                  <input type="text" className="input" placeholder="My AI Song"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Genre Tags</label>
                  <input type="text" className="input" placeholder="electronic, pop, upbeat"
                    value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
              </div>
            )}

            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={generate} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <Send size={16} />}
              {loading ? 'Generating...' : 'Generate Music'}
            </button>
          </div>

          {result && (
            <div className="card space-y-3">
              <h3 className="font-medium">Generation Started</h3>
              <div className="text-sm space-y-1 text-gray-400">
                <p>Local ID: <code className="text-brand-400">{result.localId}</code></p>
                {result.taskId && <p>Task ID: <code className="text-brand-400">{result.taskId}</code></p>}
                <p>Status: <span className={statusBadgeClass(status || result.status)}>{status || result.status}</span></p>
              </div>

              {result.taskId && (
                <button className="btn-secondary flex items-center gap-2 text-sm" onClick={checkStatus} disabled={polling}>
                  {polling ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                  Check Status
                </button>
              )}

              {audioUrls?.audio_url && (
                <div className="mt-2 space-y-2">
                  <audio src={audioUrls.audio_url} controls className="w-full" />
                  <a href={audioUrls.audio_url} download className="btn-secondary text-sm inline-flex">Download Audio</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
