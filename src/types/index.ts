export type Platform = 'google' | 'meta' | 'tiktok' | 'snapchat';

export type CampaignStatus = 'active' | 'paused' | 'deleted' | 'draft';

export type PlanTier = 'basic' | 'pro' | 'agency';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type TeamMemberStatus = 'active' | 'pending';

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  plan: PlanTier;
  trialEndsAt?: string;
  members: TeamMember[];
  connectedPlatforms: ConnectedPlatform[];
}

export interface ConnectedPlatform {
  platform: Platform;
  accountName: string;
  status: 'connected' | 'expired' | 'disconnected';
  connectedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpa: number;
  ctr: number;
  frequency: number;
  startDate: string;
  endDate?: string;
  aiOptimized: boolean;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: CampaignStatus;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface Ad {
  id: string;
  adSetId: string;
  campaignId: string;
  name: string;
  type: 'image' | 'video' | 'carousel';
  thumbnailUrl: string;
  status: CampaignStatus;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpa: number;
}

export interface AIRecommendation {
  id: string;
  campaignId?: string;
  type: 'budget' | 'creative' | 'audience' | 'pause' | 'enable';
  message: string;
  impact: string;
  confidence: number;
  applied: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'up' | 'down';
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  type: 'apply' | 'view' | 'link';
  target?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: TeamMemberStatus;
  joinedAt: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  pdfUrl: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'performance' | 'creative' | 'audience' | 'dayparting';
  createdAt: string;
  schedule?: 'daily' | 'weekly' | 'monthly';
}

export interface Tenant {
  id: string;
  orgName: string;
  ownerEmail: string;
  plan: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'suspended';
  createdAt: string;
  memberCount: number;
  adAccountCount: number;
  mrr: number;
}

export interface MetricCard {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

export interface ChartDataPoint {
  date: string;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
}
