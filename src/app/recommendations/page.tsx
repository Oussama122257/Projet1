'use client';

import { useState } from 'react';
import { Lightbulb, Check, X, TrendingUp, DollarSign, Target, Palette, Clock, Zap, Sparkles } from 'lucide-react';
import { recommendations } from '@/data/mock';
import { Recommendation } from '@/types';
import { getPlatformBgClass, getPlatformName, cn } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  budget: <DollarSign className="w-4 h-4" />,
  targeting: <Target className="w-4 h-4" />,
  creative: <Palette className="w-4 h-4" />,
  bidding: <TrendingUp className="w-4 h-4" />,
  schedule: <Clock className="w-4 h-4" />,
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState(recommendations);
  const [filter, setFilter] = useState<'all' | 'pending' | 'applied' | 'dismissed'>('all');

  const filtered = recs.filter(r => filter === 'all' || r.status === filter);
  const pending = recs.filter(r => r.status === 'pending').length;
  const applied = recs.filter(r => r.status === 'applied').length;

  const handleAction = (id: string, action: 'applied' | 'dismissed') => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-accent" />
            AI Recommendations
          </h1>
          <p className="text-text-muted text-sm mt-1">
            AI-powered insights to optimize your campaign performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-4 h-4" /> {pending} pending
            </span>
            <span className="text-text-muted">·</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-4 h-4" /> {applied} applied
            </span>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-xl border border-primary/20 p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/20">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">AI Analysis Summary</h3>
            <p className="text-sm text-text-secondary mt-1">
              Based on your campaign data, implementing all pending recommendations could increase overall ROAS by <span className="text-accent font-bold">+32%</span> and
              reduce average CPA by <span className="text-accent font-bold">-18%</span>. The highest-impact action is reallocating budget from Display to Shopping campaigns.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'applied', 'dismissed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border',
              filter === f
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-surface border-border text-text-muted hover:text-text-secondary'
            )}
          >
            {f} {f === 'all' ? `(${recs.length})` : `(${recs.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filtered.map((rec) => (
          <div key={rec.id} className={cn(
            'bg-surface rounded-xl border p-5 transition-all duration-300',
            rec.status === 'pending' ? 'border-border hover:border-primary/30' :
            rec.status === 'applied' ? 'border-emerald-500/20 opacity-75' : 'border-border opacity-50'
          )}>
            <div className="flex items-start gap-4">
              {/* Type Icon */}
              <div className={cn(
                'p-2.5 rounded-lg mt-0.5',
                rec.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
              )}>
                {typeIcons[rec.type]}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    rec.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                    rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  )}>{rec.priority} priority</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPlatformBgClass(rec.platform)}`}>
                    {getPlatformName(rec.platform)}
                  </span>
                  <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full bg-surface-hover capitalize">{rec.type}</span>
                </div>

                <h3 className="text-sm font-semibold text-text-primary mb-1">{rec.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{rec.description}</p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Expected: {rec.expectedImpact}
                  </div>
                  <span className="text-xs text-text-muted">
                    Campaign: {rec.campaignName}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {rec.status === 'pending' && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleAction(rec.id, 'applied')}
                    className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Apply
                  </button>
                  <button
                    onClick={() => handleAction(rec.id, 'dismissed')}
                    className="flex items-center gap-1.5 bg-surface-hover hover:bg-background text-text-muted px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Dismiss
                  </button>
                </div>
              )}
              {rec.status === 'applied' && (
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-3 py-2 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Applied
                </span>
              )}
              {rec.status === 'dismissed' && (
                <span className="text-xs text-text-muted bg-surface-hover px-3 py-2 rounded-lg">Dismissed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
