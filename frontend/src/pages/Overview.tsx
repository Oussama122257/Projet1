import { useEffect, useState } from 'react';
import { Video, Image, Music, CheckCircle, Clock, XCircle, Zap, TrendingUp } from 'lucide-react';
import { api, TaskStats } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { Header } from '../components/dashboard/Header';

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Video; label: string; value: string | number; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export function Overview() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [credit, setCredit] = useState<{ credit?: number; totalCredit?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTaskStats(), api.getCredit()])
      .then(([s, c]) => { setStats(s); setCredit(c?.data || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byType = (type: string) => stats?.by_type.find(t => t.type === type)?.count || 0;
  const byStatus = (status: string) => stats?.by_status.find(s => s.status === status)?.count || 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="Overview" />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Generation Stats</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Video} label="Videos Generated" value={byType('video')} color="bg-purple-600" />
                <StatCard icon={Image} label="Images Generated" value={byType('image')} color="bg-pink-600" />
                <StatCard icon={Music} label="Music Tracks" value={byType('music')} color="bg-green-600" />
                <StatCard icon={Zap} label="Credits Used" value={stats?.credits_used?.toFixed(0) || '0'} color="bg-yellow-600" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Task Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={CheckCircle} label="Successful" value={byStatus('success')} color="bg-green-700" />
                <StatCard icon={Clock} label="In Progress" value={byStatus('generating') + byStatus('pending') + byStatus('queuing')} color="bg-blue-700" />
                <StatCard icon={XCircle} label="Failed" value={byStatus('failed') + byStatus('fail')} color="bg-red-700" />
              </div>
            </div>

            {credit && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Account Credits</h2>
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={18} className="text-yellow-400" />
                    <span className="font-medium">Credit Balance</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-yellow-400">{credit.credit?.toLocaleString()}</span>
                    <span className="text-gray-400 mb-1">/ {credit.totalCredit?.toLocaleString()} total</span>
                  </div>
                  {credit.totalCredit && credit.credit !== undefined && (
                    <div className="mt-3 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (credit.credit / credit.totalCredit) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Quick Start</h2>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Go to <strong className="text-gray-200">Settings</strong> and enter your KIE.ai API key</li>
                <li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Use <strong className="text-gray-200">Video / Image / Music</strong> pages to generate content</li>
                <li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> Monitor progress in the <strong className="text-gray-200">Tasks</strong> page</li>
                <li className="flex gap-2"><span className="text-brand-400 font-bold">4.</span> Configure <strong className="text-gray-200">MCP</strong> for Claude Desktop integration</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
