import { useEffect, useState } from 'react';
import { Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/dashboard/Header';

export function Settings() {
  const { toast } = useToast();
  const [kieKey, setKieKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(s => { if (s.settings['kie_api_key']) setKieKey(s.settings['kie_api_key']); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!kieKey.trim()) { toast('error', 'API key cannot be empty'); return; }
    setSaving(true);
    try {
      await api.setSetting('kie_api_key', kieKey.trim());
      toast('success', 'KIE API key saved successfully');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="card space-y-4">
              <h2 className="font-semibold">KIE.ai API Key</h2>
              <p className="text-sm text-gray-400">
                Your KIE.ai API key is required to use the generation features. Get yours at{' '}
                <a href="https://kie.ai/api-key" target="_blank" rel="noreferrer"
                  className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                  kie.ai/api-key <ExternalLink size={12} />
                </a>
              </p>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="sk-..."
                    value={kieKey}
                    onChange={e => setKieKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && save()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="btn-primary flex items-center gap-2" onClick={save} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save API Key'}
              </button>
            </div>

            <div className="card space-y-3">
              <h2 className="font-semibold">Pricing Reference</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="text-left pb-2">Service</th>
                      <th className="text-right pb-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      ['Veo 3 Fast (8s + audio)', '~$0.40'],
                      ['Veo 3 Quality (8s + audio)', '~$2.00'],
                      ['GPT-4o Image', '~$0.03'],
                      ['Sora 2 (10s standard)', '~$0.15'],
                      ['Sora 2 Pro (10s)', '~$0.45'],
                      ['Credits', '$0.005 per credit'],
                    ].map(([service, cost]) => (
                      <tr key={service}>
                        <td className="py-2 text-gray-300">{service}</td>
                        <td className="py-2 text-right text-yellow-400 font-mono">{cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">30-80% cheaper than official APIs. Free trial: 5,000 credits (no card required).</p>
            </div>

            <div className="card space-y-3">
              <h2 className="font-semibold">Backend Info</h2>
              <div className="text-sm space-y-1 text-gray-400">
                <p>Backend URL: <code className="text-brand-400">http://localhost:3001</code></p>
                <p>Frontend URL: <code className="text-brand-400">http://localhost:5173</code></p>
                <p>Database: <code className="text-brand-400">./backend/data/kie_saas.db</code></p>
                <p>Webhook callback: <code className="text-brand-400">POST http://localhost:3001/api/webhooks/callback</code></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
