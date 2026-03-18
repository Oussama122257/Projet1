'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { ChatMessage } from '@/types';
import { aiChatSuggestions, campaigns, platformMetrics } from '@/data/mock';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';

const generateAIResponse = (input: string): string => {
  const lower = input.toLowerCase();

  if (lower.includes('best roas') || lower.includes('best performing')) {
    const best = [...campaigns].filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas)[0];
    return `**Top ROAS Campaign: ${best.name}**\n\nYour best performing campaign is "${best.name}" on ${best.platform} with a **${best.roas}x ROAS**.\n\n📊 Key metrics:\n- Spent: ${formatCurrency(best.spent)} of ${formatCurrency(best.budget)} budget\n- Conversions: ${formatNumber(best.conversions)}\n- CTR: ${best.ctr}%\n- CPA: ${formatCurrency(best.cpa)}\n\n💡 **Recommendation:** This campaign is performing exceptionally well. Consider increasing the budget by 25-30% to capture more conversions while maintaining efficiency.`;
  }

  if (lower.includes('reduce cpa') || lower.includes('snapchat')) {
    return `**Reducing CPA on Snapchat Campaigns**\n\nYour Snapchat campaigns currently have an average CPA of **$13.05**. Here are actionable steps:\n\n1. **Refresh Creatives** - Your current ads show signs of fatigue (CTR declining). Create 3-4 new video variations with different hooks.\n\n2. **Narrow Targeting** - Focus on your top-converting audience segments (18-34, urban areas). Remove broad targeting.\n\n3. **Optimize for Conversions** - Switch from "Impressions" to "Pixel Purchase" optimization to let the algorithm find buyers.\n\n4. **Daypart Scheduling** - Data shows 72% of your conversions happen 6PM-11PM. Concentrate budget there.\n\n📈 Expected impact: **-25% CPA reduction** within 2 weeks.`;
  }

  if (lower.includes('compare') || lower.includes('facebook vs tiktok') || lower.includes('facebook') && lower.includes('tiktok')) {
    return `**Facebook vs TikTok Performance Comparison**\n\n| Metric | Facebook | TikTok |\n|--------|----------|--------|\n| Spend | $5,290 | $3,990 |\n| Impressions | 330K | 1.2M |\n| Conversions | 620 | 360 |\n| CTR | 3.77% | 3.00% |\n| CPC | $0.42 | $0.11 |\n| ROAS | 5.2x | 3.1x |\n\n**Analysis:**\n- 🏆 **Facebook** wins on ROAS (5.2x vs 3.1x) and conversion volume\n- 🏆 **TikTok** wins on reach (3.6x more impressions) and CPC ($0.11 vs $0.42)\n\n💡 **Recommendation:** Use TikTok for top-of-funnel awareness and Facebook for conversion-focused campaigns. Allocate 60% budget to Facebook, 40% to TikTok.`;
  }

  if (lower.includes('budget') || lower.includes('split') || lower.includes('allocat')) {
    return `**Optimal Budget Allocation Recommendation**\n\nBased on current performance data, here's the recommended budget split:\n\n📊 **Recommended Allocation:**\n- **Google Ads: 40%** - Highest ROAS (4.8x), strong conversion intent\n- **Facebook Ads: 30%** - Excellent ROAS (5.2x), proven conversion funnel\n- **TikTok Ads: 20%** - Best reach/cost ratio, growing conversions\n- **Snapchat Ads: 10%** - Maintain presence, optimize before scaling\n\n**vs Current Split:**\n- Google: 49% → 40% (redirect excess to Facebook)\n- Facebook: 17% → 30% (scale winning campaigns)\n- TikTok: 13% → 20% (increase awareness budget)\n- Snapchat: 21% → 10% (reduce until CPA improves)\n\n📈 **Projected impact:** +18% overall ROAS, -12% blended CPA`;
  }

  if (lower.includes('underperform') || lower.includes('attention') || lower.includes('worst')) {
    return `**Campaigns Needing Attention** ⚠️\n\n1. **Google Display Network** (Google)\n   - ROAS: 2.1x (below 3x threshold)\n   - CTR: 1.2% (very low)\n   - Action: Exclude low-performing placements, narrow audience\n\n2. **TikTok Influencer Collab** (TikTok) - PAUSED\n   - ROAS: 2.4x\n   - CPA: $14.00 (too high)\n   - Action: Review influencer content quality, consider different creators\n\n3. **Snap Story Ads** (Snapchat)\n   - ROAS: 2.9x (borderline)\n   - CPA: $13.05\n   - Action: Refresh creatives, optimize scheduling\n\n💡 **Quick wins:** Pausing Google Display and reallocating to Shopping could save **$2,180** and generate **~180 more conversions**.`;
  }

  if (lower.includes('predict') || lower.includes('forecast') || lower.includes('next week')) {
    return `**Performance Forecast - Next 7 Days** 🔮\n\nBased on current trends and seasonal patterns:\n\n📊 **Predicted Metrics:**\n- Impressions: ~850K (+5% vs last week)\n- Clicks: ~28K (+8% vs last week)\n- Conversions: ~720 (+12% vs last week)\n- Spend: ~$7,200\n- Revenue: ~$31,500\n- Projected ROAS: 4.4x\n\n📈 **Trends:**\n- Weekend performance typically spikes 15-20%\n- Mid-week (Tue-Thu) has best conversion rates\n- TikTok engagement rising with spring content\n\n⚠️ **Watch out for:**\n- Facebook CPMs trending up (competitive auction pressure)\n- Google Shopping ads may see higher CPC due to seasonal demand\n\n💡 **Action:** Pre-load creative variations for the weekend surge to maximize ROI.`;
  }

  return `Great question! Let me analyze your campaign data...\n\nBased on your current performance across all platforms:\n\n📊 **Quick Summary:**\n- Total active campaigns: ${campaigns.filter(c => c.status === 'active').length}\n- Total spend: ${formatCurrency(campaigns.reduce((s, c) => s + c.spent, 0))}\n- Best platform: Google Ads (4.8x ROAS)\n- Needs attention: Display Network (low CTR)\n\nWould you like me to dive deeper into any specific platform, campaign, or metric? I can help with:\n- Budget optimization recommendations\n- Creative performance analysis\n- Audience targeting suggestions\n- Competitive benchmarking insights`;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm your AI Campaign Analyst. I can help you analyze your campaign performance, provide optimization recommendations, and answer questions about your advertising data across Facebook, TikTok, Google, and Snapchat.\n\nWhat would you like to know?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(msg);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-accent" />
            AI Chat
          </h1>
          <p className="text-text-muted text-sm mt-1">Ask anything about your campaigns and get AI-powered insights</p>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-accent" />
              </div>
            )}
            <div className={cn(
              'max-w-[70%] rounded-xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-surface border border-border text-text-primary rounded-tl-sm'
            )}>
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
                  .replace(/\|(.+)\|/g, (match) => `<code class="text-xs">${match}</code>`)
              }} />
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3 rounded-tl-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {aiChatSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="bg-surface border border-border hover:border-primary/30 text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg text-xs transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 bg-surface border border-border rounded-xl p-3">
        <input
          type="text"
          placeholder="Ask about your campaigns, metrics, or optimization tips..."
          className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
