import { useState } from 'react';
import { Video, Send, RefreshCw } from 'lucide-react';
import { api, TaskResult } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/dashboard/Header';
import { statusBadgeClass } from '../lib/utils';

const MODELS = [
  { value: 'veo3_quality', label: 'Veo 3 Quality (~$2.00/8s)' },
  { value: 'veo3_fast', label: 'Veo 3 Fast (~$0.40/8s)' },
  { value: 'veo3_lite', label: 'Veo 3 Lite (Budget)' },
  { value: 'runway_aleph', label: 'Runway Aleph' },
  { value: 'kling_2_1', label: 'Kling 2.1' },
];
const RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];

export function VideoGen() {
  const { toast } = useToast();
  const [form, setForm] = useState({ prompt: '', model: 'veo3_fast', aspectRatio: '16:9', duration: 8, imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(TaskResult & { taskId: string | null }) | null>(null);
  const [polling, setPolling] = useState(false);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);

  const generate = async () => {
    if (!form.prompt.trim()) { toast('error', 'Prompt is required'); return; }
    setLoading(true); setResult(null); setStatusData(null);
    try {
      const res = await api.generateVideo({ ...form, imageUrl: form.imageUrl || undefined });
      setResult(res as TaskResult & { taskId: string | null });
      toast('success', 'Video generation started! Task ID: ' + (res.taskId || res.localId));
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
      const data = await api.getVideoStatus(result.taskId) as Record<string, unknown>;
      setStatusData(data);
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setPolling(false);
    }
  };

  const status = (statusData as { data?: { status?: string } } | null)?.data?.status;
  const resultUrl = (statusData as { data?: { resultUrl?: string } } | null)?.data?.resultUrl;

  return (
    <div className="flex flex-col h-full">
      <Header title="Video Generation" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-5">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Video size={18} className="text-purple-400" />
              <h2 className="font-semibold">Generate Video</h2>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Prompt *</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="A cinematic shot of a futuristic city at sunset with flying cars..."
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
              <label className="block text-sm text-gray-400 mb-1.5">Duration (seconds)</label>
              <input type="number" className="input" min={5} max={60} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))} />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Image URL (optional — for image-to-video)</label>
              <input type="url" className="input" placeholder="https://example.com/image.jpg"
                value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>

            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={generate} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <Send size={16} />}
              {loading ? 'Generating...' : 'Generate Video'}
            </button>
          </div>

          {result && (
            <div className="card space-y-3">
              <h3 className="font-medium text-gray-200">Generation Started</h3>
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

              {resultUrl && (
                <div className="mt-2">
                  <video src={resultUrl} controls className="w-full rounded-lg bg-gray-800" />
                  <a href={resultUrl} download className="btn-secondary mt-2 text-sm inline-flex">Download Video</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
