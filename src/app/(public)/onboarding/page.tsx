'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Check, ArrowRight, Zap, Code, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const platforms = [
  { id: 'google', name: 'Google Ads', color: '#4285f4' },
  { id: 'meta', name: 'Meta Ads', color: '#1877f2' },
  { id: 'tiktok', name: 'TikTok Ads', color: '#ff0050' },
  { id: 'snapchat', name: 'Snapchat Ads', color: '#FFFC00' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [connected, setConnected] = useState<string[]>([]);

  const togglePlatform = (id: string) => {
    setConnected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
              }`}>
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-2">Create your organization</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mb-6">This will be your workspace for managing campaigns.</p>
              <div className="space-y-4">
                <Input label="Organization name" placeholder="e.g. Acme Corp" value={orgName} onChange={e => setOrgName(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Logo (optional)</label>
                  <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 text-center hover:border-[var(--color-primary)]/30 transition-colors cursor-pointer">
                    <Upload size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-muted)]">Click to upload or drag and drop</p>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" onClick={() => setStep(2)}>Continue <ArrowRight size={16} /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-2">Connect your ad accounts</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mb-6">Link your advertising platforms to start tracking performance.</p>
              <div className="space-y-3">
                {platforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                      connected.includes(p.id)
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.color + '20' }}>
                        <Zap size={16} style={{ color: p.color }} />
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    {connected.includes(p.id) ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-sm"><Check size={16} /> Connected</span>
                    ) : (
                      <span className="text-sm text-[var(--color-primary)]">Connect</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Skip for now</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Continue <ArrowRight size={16} /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-2">Set up tracking</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mb-6">Connect your store or install our tracking pixel for conversion tracking.</p>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer text-left">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ShoppingBag size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Connect Shopify / WooCommerce</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Auto-sync orders and revenue data</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer text-left">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Code size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Install tracking pixel</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Add a code snippet to your website</p>
                  </div>
                </button>
              </div>
              <Button className="w-full mt-6" onClick={() => router.push('/dashboard')}>Go to dashboard <ArrowRight size={16} /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
