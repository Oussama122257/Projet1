'use client';
import { useState } from 'react';
import { CreditCard, Download, Check, AlertTriangle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { invoices } from '@/data/mock';
import { statusColor } from '@/lib/utils';

const plans = [
  { name: 'Basic', price: 29, features: ['Up to $10K ad spend', '2 ad accounts', '1 team member', 'Basic AI insights'] },
  { name: 'Pro', price: 99, current: true, features: ['Up to $50K ad spend', '10 ad accounts', '5 team members', 'Advanced AI insights', 'Custom reports', 'API access'] },
  { name: 'Agency', price: 299, features: ['Unlimited ad spend', 'Unlimited accounts', 'Unlimited members', 'Full AI suite', 'White-label reports', 'Dedicated support'] },
];

export default function BillingPage() {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {/* Trial banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle size={20} className="text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">12 days left on your free trial</p>
          <p className="text-xs text-[var(--color-text-muted)]">Add a payment method to continue using AdPilot after your trial ends.</p>
        </div>
        <Button size="sm">Add payment method</Button>
      </div>

      {/* Current plan */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Current Plan</h2>
          <Button variant="outline" onClick={() => setChangePlanOpen(true)}>Change plan</Button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Sparkles size={24} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Pro Plan</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">$99/month &middot; Billed monthly</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {plans[1].features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Check size={16} className="text-emerald-400 shrink-0" />{f}
            </div>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Usage Summary</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[var(--color-text-secondary)]">Ad spend tracked</span>
              <span>$29,865 / $50,000</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[var(--color-text-secondary)]">Team seats</span>
              <span>3 / 5</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[var(--color-text-secondary)]">Ad accounts</span>
              <span>4 / 10</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Payment Methods</h2>
          <Button variant="outline" size="sm">Add card</Button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
          <CreditCard size={24} className="text-[var(--color-text-muted)]" />
          <div className="flex-1">
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="text-xs text-[var(--color-text-muted)]">Expires 12/2026</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400">Default</Badge>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Invoices</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Date', 'Amount', 'Status', 'Download'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                <td className="px-5 py-3 text-sm">{inv.date}</td>
                <td className="px-5 py-3 text-sm font-medium">${inv.amount}.00</td>
                <td className="px-5 py-3"><Badge className={statusColor(inv.status)}>{inv.status}</Badge></td>
                <td className="px-5 py-3"><Button size="sm" variant="ghost"><Download size={14} /> PDF</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel */}
      <div className="bg-[var(--color-surface)] border border-red-500/20 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Cancel Subscription</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">Cancel your subscription. Your data will be kept for 30 days after cancellation.</p>
        <Button variant="destructive" onClick={() => setCancelOpen(true)}>Cancel subscription</Button>
      </div>

      {/* Change plan modal */}
      <Modal open={changePlanOpen} onClose={() => setChangePlanOpen(false)} title="Change Plan">
        <div className="space-y-3">
          {plans.map(p => (
            <button
              key={p.name}
              className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${
                p.current ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{p.name}</span>
                <span className="font-bold">${p.price}/mo</span>
              </div>
              {p.current && <Badge className="bg-[var(--color-primary)]/20 text-[var(--color-primary)]">Current plan</Badge>}
            </button>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setChangePlanOpen(false)}>Cancel</Button>
            <Button>Confirm change</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Subscription">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Are you sure you want to cancel? You&apos;ll lose access to premium features at the end of your billing period.</p>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Reason for cancelling (optional)</label>
            {['Too expensive', 'Missing features', 'Switching to competitor', 'Not using it enough'].map(r => (
              <label key={r} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input type="radio" name="reason" className="accent-red-500" /> {r}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep subscription</Button>
            <Button variant="destructive" onClick={() => setCancelOpen(false)}>Confirm cancellation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
