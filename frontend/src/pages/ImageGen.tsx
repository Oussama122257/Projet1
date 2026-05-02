import { useState } from 'react';
import { Image, Send, RefreshCw } from 'lucide-react';
import { api, TaskResult } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/dashboard/Header';
import { statusBadgeClass } from '../lib/utils';

const MODELS = [
  { value: 'flux-kontext-pro', label: 'Flux Kontext Pro' },
  { value: 'flux-kontext-max', label: 'Flux Kontext Max' },
  { value: '4o-image', label: 'GPT-4o Image (~$0.03)' },
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'nano-banana-pro', label: 'Nano Banana Pro' },
];
const RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

export function ImageGen() {
  const { toast } = useToast();
  const [form, setForm] = useState({ prompt: '', model: 'flux-kontext-pro', aspectRatio: '1:1', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(TaskResult & { taskId: string | null; data?: { imageUrl?: string; resultUrl?: string } }) | null>(null);
  const [polling, setPolling] = useState(false);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);

  const generate = async () => {
    if (!form.prompt.trim()) { toast('error', 'Prompt is required'); return; }
    setLoading(true); setResult(null); setStatusData(null);
    try {
      const res = await api.generateImage({ ...form, imageUrl: form.imageUrl || undefined }) as TaskResult & { taskId: string | null; data?: { imageUrl?: string } };
      setResult(res);
      toast('success', 'Image generation started!');
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
  const imgUrl = (statusData as { data?: { resultUrl?: string; imageUrl?: string } } | null)?.data?.resultUrl
    || (statusData as { data?: { imageUrl?: string } } | null)?.data?.imageUrl
    || result?.data?.imageUrl || result?.data?.resultUrl;

  return (
    <div className="flex flex-col h-full">
      <Header title="Image Generation" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-5">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Image size={18} className="text-pink-400" />
              <h2 className="font-semibold">Generate Image</h2>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Prompt *</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="A photorealistic portrait of a futuristic robot with glowing eyes..."
                value={form.prompt}
                onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Model</label>
                <select className="select" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}>
                  {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Aspect Ratio</label>
                <select className="select" value={form.aspectRatio} onChange={e => setForm(f => ({ ...f, aspectRatio: e.target.value }))}>
                  {RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Reference Image URL (optional — for image editing)</label>
              <input type="url" className="input" placeholder="https://example.com/reference.jpg"
                value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>

            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={generate} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <Send size={16} />}
              {loading ? 'Generating...' : form.imageUrl ? 'Edit Image' : 'Generate Image'}
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

              {imgUrl && (
                <div className="mt-2">
                  <img src={imgUrl} alt="Generated" className="w-full rounded-lg bg-gray-800" />
                  <a href={imgUrl} download target="_blank" rel="noreferrer" className="btn-secondary mt-2 text-sm inline-flex">Open Image</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
