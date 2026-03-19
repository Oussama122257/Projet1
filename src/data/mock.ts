import { Campaign, AdSet, Ad, AIRecommendation, TeamMember, Invoice, Report, Tenant, ChartDataPoint, ChatMessage } from '@/types';

export const campaigns: Campaign[] = [
  { id: '1', name: 'Summer Sale 2025', platform: 'meta', status: 'active', budget: 5000, spend: 3245, impressions: 450000, clicks: 12500, conversions: 320, roas: 4.2, cpa: 10.14, ctr: 2.78, frequency: 2.1, startDate: '2025-06-01', aiOptimized: true },
  { id: '2', name: 'Brand Awareness Q3', platform: 'google', status: 'active', budget: 8000, spend: 6120, impressions: 890000, clicks: 23400, conversions: 156, roas: 2.8, cpa: 39.23, ctr: 2.63, frequency: 3.4, startDate: '2025-07-01', endDate: '2025-09-30', aiOptimized: true },
  { id: '3', name: 'App Install Campaign', platform: 'tiktok', status: 'active', budget: 3000, spend: 2180, impressions: 1200000, clicks: 45000, conversions: 890, roas: 5.1, cpa: 2.45, ctr: 3.75, frequency: 1.8, startDate: '2025-08-15', aiOptimized: false },
  { id: '4', name: 'Holiday Retargeting', platform: 'meta', status: 'paused', budget: 2000, spend: 1450, impressions: 180000, clicks: 5600, conversions: 210, roas: 6.8, cpa: 6.90, ctr: 3.11, frequency: 4.2, startDate: '2025-11-01', endDate: '2025-12-31', aiOptimized: true },
  { id: '5', name: 'Product Launch', platform: 'snapchat', status: 'active', budget: 4000, spend: 2890, impressions: 670000, clicks: 18900, conversions: 445, roas: 3.9, cpa: 6.49, ctr: 2.82, frequency: 2.6, startDate: '2025-09-01', aiOptimized: false },
  { id: '6', name: 'Local Store Traffic', platform: 'google', status: 'active', budget: 1500, spend: 980, impressions: 125000, clicks: 4200, conversions: 89, roas: 3.2, cpa: 11.01, ctr: 3.36, frequency: 1.5, startDate: '2025-10-01', aiOptimized: true },
  { id: '7', name: 'Video Engagement', platform: 'tiktok', status: 'paused', budget: 2500, spend: 1800, impressions: 980000, clicks: 35000, conversions: 120, roas: 1.9, cpa: 15.0, ctr: 3.57, frequency: 2.0, startDate: '2025-07-15', aiOptimized: false },
  { id: '8', name: 'Lead Gen Finance', platform: 'meta', status: 'active', budget: 6000, spend: 4500, impressions: 520000, clicks: 15800, conversions: 678, roas: 7.2, cpa: 6.64, ctr: 3.04, frequency: 3.1, startDate: '2025-08-01', aiOptimized: true },
  { id: '9', name: 'Spring Collection', platform: 'snapchat', status: 'deleted', budget: 3500, spend: 3500, impressions: 410000, clicks: 11200, conversions: 234, roas: 2.5, cpa: 14.96, ctr: 2.73, frequency: 3.8, startDate: '2025-03-01', endDate: '2025-05-31', aiOptimized: false },
  { id: '10', name: 'Back to School', platform: 'google', status: 'active', budget: 4500, spend: 3200, impressions: 780000, clicks: 21000, conversions: 512, roas: 5.6, cpa: 6.25, ctr: 2.69, frequency: 2.3, startDate: '2025-08-01', endDate: '2025-09-15', aiOptimized: true },
];

export const adSets: AdSet[] = [
  { id: 'as1', campaignId: '1', name: 'Lookalike - Purchasers', status: 'active', spend: 1800, impressions: 250000, clicks: 7200, conversions: 185 },
  { id: 'as2', campaignId: '1', name: 'Interest - Fashion', status: 'active', spend: 1000, impressions: 130000, clicks: 3800, conversions: 98 },
  { id: 'as3', campaignId: '1', name: 'Retargeting - Cart Abandoners', status: 'active', spend: 445, impressions: 70000, clicks: 1500, conversions: 37 },
];

export const ads: Ad[] = [
  { id: 'ad1', adSetId: 'as1', campaignId: '1', name: 'Summer Vibes Video', type: 'video', thumbnailUrl: '', status: 'active', spend: 950, impressions: 130000, clicks: 3800, conversions: 98, ctr: 2.92, cpa: 9.69 },
  { id: 'ad2', adSetId: 'as1', campaignId: '1', name: 'Testimonial Carousel', type: 'carousel', thumbnailUrl: '', status: 'active', spend: 850, impressions: 120000, clicks: 3400, conversions: 87, ctr: 2.83, cpa: 9.77 },
  { id: 'ad3', adSetId: 'as2', campaignId: '1', name: 'Flash Sale Banner', type: 'image', thumbnailUrl: '', status: 'active', spend: 520, impressions: 75000, clicks: 2100, conversions: 54, ctr: 2.80, cpa: 9.63 },
  { id: 'ad4', adSetId: 'as2', campaignId: '1', name: 'Product Showcase', type: 'image', thumbnailUrl: '', status: 'paused', spend: 480, impressions: 55000, clicks: 1700, conversions: 44, ctr: 3.09, cpa: 10.91 },
  { id: 'ad5', adSetId: 'as3', campaignId: '1', name: 'Reminder Video', type: 'video', thumbnailUrl: '', status: 'active', spend: 445, impressions: 70000, clicks: 1500, conversions: 37, ctr: 2.14, cpa: 12.03 },
];

export const recommendations: AIRecommendation[] = [
  { id: 'r1', campaignId: '1', type: 'budget', message: 'Increase budget for "Summer Sale 2025" by 15% to maximize ROAS during peak hours.', impact: '+12% conversions estimated', confidence: 0.89, applied: false },
  { id: 'r2', campaignId: '7', type: 'pause', message: 'Pause "Video Engagement" campaign — ROAS has dropped below 2.0 for 5 consecutive days.', impact: 'Save $120/day', confidence: 0.92, applied: false },
  { id: 'r3', campaignId: '3', type: 'creative', message: 'Your TikTok video ads with UGC style perform 2.3x better. Create more UGC content for "App Install Campaign".', impact: '+35% CTR potential', confidence: 0.85, applied: false },
  { id: 'r4', campaignId: '8', type: 'audience', message: 'Users aged 25-34 convert 40% better on "Lead Gen Finance". Increase bid for this demographic.', impact: '+18% conversion rate', confidence: 0.91, applied: false },
  { id: 'r5', campaignId: '6', type: 'enable', message: 'Enable ad scheduling for "Local Store Traffic" — performance peaks between 10am-2pm.', impact: '+22% ROAS improvement', confidence: 0.87, applied: false },
];

export const chartData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 7, i + 1);
  const base = Math.sin(i / 5) * 500 + 2000;
  return {
    date: date.toISOString().split('T')[0],
    spend: Math.round(base + Math.random() * 300),
    clicks: Math.round((base * 3.5) + Math.random() * 1000),
    conversions: Math.round((base * 0.12) + Math.random() * 30),
    impressions: Math.round((base * 120) + Math.random() * 50000),
  };
});

export const teamMembers: TeamMember[] = [
  { id: 't1', name: 'Sarah Chen', email: 'sarah@company.com', role: 'owner', status: 'active', joinedAt: '2025-01-15' },
  { id: 't2', name: 'Mike Rodriguez', email: 'mike@company.com', role: 'admin', status: 'active', joinedAt: '2025-02-20' },
  { id: 't3', name: 'Emily Park', email: 'emily@company.com', role: 'member', status: 'active', joinedAt: '2025-03-10' },
  { id: 't4', name: 'James Wilson', email: 'james@company.com', role: 'viewer', status: 'pending', joinedAt: '2025-08-01' },
  { id: 't5', name: 'Lisa Thompson', email: 'lisa@company.com', role: 'member', status: 'active', joinedAt: '2025-05-18' },
];

export const invoices: Invoice[] = [
  { id: 'inv1', date: '2025-08-01', amount: 99, status: 'paid', pdfUrl: '#' },
  { id: 'inv2', date: '2025-07-01', amount: 99, status: 'paid', pdfUrl: '#' },
  { id: 'inv3', date: '2025-06-01', amount: 99, status: 'paid', pdfUrl: '#' },
  { id: 'inv4', date: '2025-05-01', amount: 49, status: 'paid', pdfUrl: '#' },
  { id: 'inv5', date: '2025-04-01', amount: 49, status: 'paid', pdfUrl: '#' },
];

export const reports: Report[] = [
  { id: 'rp1', name: 'Campaign Performance Summary', type: 'performance', createdAt: '2025-08-15', schedule: 'weekly' },
  { id: 'rp2', name: 'Creative Performance', type: 'creative', createdAt: '2025-08-10' },
  { id: 'rp3', name: 'Audience Insights', type: 'audience', createdAt: '2025-08-05', schedule: 'monthly' },
  { id: 'rp4', name: 'Hourly/Dayparting Analysis', type: 'dayparting', createdAt: '2025-07-28' },
];

export const tenants: Tenant[] = [
  { id: 'tn1', orgName: 'Acme Corp', ownerEmail: 'admin@acme.com', plan: 'agency', status: 'active', createdAt: '2025-01-10', memberCount: 12, adAccountCount: 8, mrr: 299 },
  { id: 'tn2', orgName: 'StartupXYZ', ownerEmail: 'founder@startupxyz.com', plan: 'pro', status: 'trialing', createdAt: '2025-08-01', memberCount: 3, adAccountCount: 2, mrr: 99 },
  { id: 'tn3', orgName: 'BigRetail Inc', ownerEmail: 'marketing@bigretail.com', plan: 'agency', status: 'active', createdAt: '2025-03-15', memberCount: 25, adAccountCount: 15, mrr: 299 },
  { id: 'tn4', orgName: 'Local Bakery', ownerEmail: 'owner@localbakery.com', plan: 'basic', status: 'past_due', createdAt: '2025-06-20', memberCount: 1, adAccountCount: 1, mrr: 29 },
  { id: 'tn5', orgName: 'TechFlow', ownerEmail: 'cto@techflow.io', plan: 'pro', status: 'active', createdAt: '2025-04-05', memberCount: 7, adAccountCount: 4, mrr: 99 },
  { id: 'tn6', orgName: 'FashionHub', ownerEmail: 'hello@fashionhub.co', plan: 'pro', status: 'active', createdAt: '2025-05-12', memberCount: 5, adAccountCount: 3, mrr: 99 },
];

export const chatMessages: ChatMessage[] = [
  { id: 'cm1', role: 'assistant', content: 'Hello! I\'m your AI advertising assistant. I can help you analyze campaigns, suggest optimizations, and answer questions about your ad performance. What would you like to know?', timestamp: '2025-08-20T09:00:00Z' },
];

export const suggestedPrompts = [
  'Why did my ROAS drop yesterday?',
  'Show me top 3 underperforming ads',
  'Increase budget for Summer Sale by 10%',
  'Compare Google vs Meta performance this month',
  'Which creative type performs best on TikTok?',
  'What\'s my best performing audience segment?',
];
