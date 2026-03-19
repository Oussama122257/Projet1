'use client';
import Link from 'next/link';
import { Zap, BarChart3, Brain, Layers, ArrowRight, Check, Star } from 'lucide-react';
import Button from '@/components/ui/Button';

const features = [
  { icon: BarChart3, title: 'Multi-Platform Analytics', desc: 'Unified dashboard for Google, Meta, TikTok & Snapchat campaigns.' },
  { icon: Brain, title: 'AI-Powered Insights', desc: 'Get intelligent recommendations to optimize spend and maximize ROAS.' },
  { icon: Layers, title: 'Creative Analysis', desc: 'Understand which creatives perform best with AI-driven analysis.' },
];

const plans = [
  { name: 'Basic', price: 29, features: ['Up to $10K ad spend', '2 ad accounts', '1 team member', 'Basic AI insights', 'Email reports'], cta: 'Start free trial' },
  { name: 'Pro', price: 99, popular: true, features: ['Up to $50K ad spend', '10 ad accounts', '5 team members', 'Advanced AI insights', 'Custom reports', 'API access'], cta: 'Start free trial' },
  { name: 'Agency', price: 299, features: ['Unlimited ad spend', 'Unlimited accounts', 'Unlimited members', 'Full AI suite', 'White-label reports', 'Dedicated support'], cta: 'Contact sales' },
];

const platformLogos = [
  { name: 'Google Ads', color: '#4285f4' },
  { name: 'Meta Ads', color: '#1877f2' },
  { name: 'TikTok Ads', color: '#ff0050' },
  { name: 'Snapchat Ads', color: '#FFFC00' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">AdPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/signup"><Button size="sm">Start free trial</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-full px-4 py-1.5 mb-6">
          <Star size={14} className="text-[var(--color-primary)]" />
          <span className="text-sm text-[var(--color-primary)]">AI-Powered Ad Optimization</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          AI that <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">learns from your ads</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
          Unify your ad campaigns across all platforms. Get AI-powered insights, optimize spend automatically, and scale your ROAS.
        </p>
        <div className="flex items-center justify-center gap-4 mb-12">
          <Link href="/signup"><Button size="lg">Start free trial <ArrowRight size={18} /></Button></Link>
          <Link href="/login"><Button variant="outline" size="lg">View demo</Button></Link>
        </div>
        {/* Platform logos */}
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {platformLogos.map(p => (
            <div key={p.name} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-sm text-[var(--color-text-secondary)]">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to optimize ads</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-primary)]/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-center text-[var(--color-text-secondary)] mb-12">Start with a 14-day free trial. No credit card required.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-[var(--color-surface)] border rounded-xl p-6 relative ${plan.popular ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)]'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-medium px-3 py-1 rounded-full">Most Popular</span>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-[var(--color-text-muted)]">/mo</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Check size={16} className="text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">{plan.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-muted)]">AdPilot &copy; 2025. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
