'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Sparkles, Pin, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { chatMessages as initialMessages, suggestedPrompts, campaigns } from '@/data/mock';
import { ChatMessage } from '@/types';

const aiResponses: Record<string, string> = {
  'roas': `Based on my analysis, your ROAS dropped by 12% yesterday primarily due to:\n\n1. **Increased CPM** on Meta (+18%) — likely due to higher auction competition\n2. **Lower conversion rate** on "Summer Sale 2025" (-8%) — the landing page load time increased\n\n**Recommendations:**\n- Shift 20% of Meta budget to TikTok where CPMs are lower\n- Check your landing page performance\n- Consider dayparting to avoid peak CPM hours (2-4pm)`,
  'underperforming': `Here are your top 3 underperforming ads:\n\n| Ad Name | Campaign | CTR | CPA | Status |\n|---------|----------|-----|-----|--------|\n| Flash Sale Banner | Summer Sale | 1.2% | $18.50 | Active |\n| Product Showcase | Summer Sale | 0.9% | $22.10 | Active |\n| Reminder Video | Summer Sale | 0.7% | $25.30 | Active |\n\nI recommend pausing "Reminder Video" — it has the highest CPA and lowest CTR.`,
  'default': `I've analyzed your campaign data. Here's what I found:\n\n- Your overall ROAS is **4.2x** across all platforms\n- **Meta** is your best performing platform with 6.8x ROAS on retargeting\n- **TikTok** has the lowest CPA at $2.45 for app installs\n\nWould you like me to provide specific recommendations for any campaign?`,
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let response = aiResponses.default;
      if (lower.includes('roas') || lower.includes('drop')) response = aiResponses.roas;
      else if (lower.includes('underperform') || lower.includes('worst')) response = aiResponses.underperforming;

      const aiMsg: ChatMessage = {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        actions: [{ label: 'View campaign', type: 'view', target: '/campaigns/1' }],
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const setFeedback = (id: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback } : m));
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] gap-6 animate-fade-in">
      {/* Chat */}
      <div className="flex-1 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Powered by Claude + Gemini</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-2xl rounded-br-sm px-4 py-3' : 'bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl rounded-bl-sm px-4 py-3'}`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--color-border)]/50">
                    {m.actions?.map((a, i) => (
                      <Button key={i} size="sm" variant="outline" onClick={() => window.location.href = a.target || '#'}>
                        {a.label} <ArrowRight size={12} />
                      </Button>
                    ))}
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => setFeedback(m.id, 'up')}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${m.feedback === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => setFeedback(m.id, 'down')}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${m.feedback === 'down' ? 'text-red-400 bg-red-400/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestedPrompts.slice(0, 4).map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)} className="px-3 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-full text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30 transition-colors cursor-pointer">
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about your campaigns..."
              className="flex-1 px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            />
            <Button type="submit" disabled={!input.trim() || isTyping}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>

      {/* Context panel (hidden on mobile) */}
      <div className="hidden lg:block w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-5 h-fit">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Pin size={14} /> Context</h3>
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm">
              <p className="text-[var(--color-text-muted)] text-xs mb-1">Organization</p>
              <p className="font-medium">Acme Corp</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm">
              <p className="text-[var(--color-text-muted)] text-xs mb-1">Date Range</p>
              <p className="font-medium">Last 7 days</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Pinned Campaigns</h3>
          <div className="space-y-2">
            {campaigns.slice(0, 3).map(c => (
              <div key={c.id} className="p-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{c.platform} &middot; {c.roas.toFixed(1)}x ROAS</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Quick Prompts</h3>
          <div className="space-y-1.5">
            {suggestedPrompts.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)} className="w-full text-left p-2 rounded-lg text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
