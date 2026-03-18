export type Platform = 'facebook' | 'tiktok' | 'google' | 'snapchat';

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  startDate: string;
  endDate: string;
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
}

export interface Recommendation {
  id: string;
  campaignId: string;
  campaignName: string;
  platform: Platform;
  type: 'budget' | 'targeting' | 'creative' | 'bidding' | 'schedule';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  status: 'pending' | 'applied' | 'dismissed';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PlatformMetrics {
  platform: Platform;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCPC: number;
  avgROAS: number;
  campaigns: number;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}
