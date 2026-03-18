import { Campaign, Recommendation, PlatformMetrics, DailyMetric } from '@/types';

export const campaigns: Campaign[] = [
  {
    id: '1', name: 'Summer Sale 2026', platform: 'facebook', status: 'active',
    budget: 5000, spent: 3420, impressions: 245000, clicks: 8200,
    conversions: 340, ctr: 3.35, cpc: 0.42, cpa: 10.06, roas: 4.2,
    startDate: '2026-03-01', endDate: '2026-03-31'
  },
  {
    id: '2', name: 'Brand Awareness TikTok', platform: 'tiktok', status: 'active',
    budget: 3000, spent: 1890, impressions: 520000, clicks: 15600,
    conversions: 210, ctr: 3.0, cpc: 0.12, cpa: 9.0, roas: 3.8,
    startDate: '2026-03-05', endDate: '2026-04-05'
  },
  {
    id: '3', name: 'Google Search - Products', platform: 'google', status: 'active',
    budget: 8000, spent: 5640, impressions: 180000, clicks: 12600,
    conversions: 580, ctr: 7.0, cpc: 0.45, cpa: 9.72, roas: 5.1,
    startDate: '2026-02-15', endDate: '2026-03-31'
  },
  {
    id: '4', name: 'Snap Story Ads', platform: 'snapchat', status: 'active',
    budget: 2000, spent: 1240, impressions: 310000, clicks: 6200,
    conversions: 95, ctr: 2.0, cpc: 0.20, cpa: 13.05, roas: 2.9,
    startDate: '2026-03-10', endDate: '2026-04-10'
  },
  {
    id: '5', name: 'Retargeting - Cart Abandoners', platform: 'facebook', status: 'active',
    budget: 2500, spent: 1870, impressions: 85000, clicks: 4250,
    conversions: 280, ctr: 5.0, cpc: 0.44, cpa: 6.68, roas: 6.8,
    startDate: '2026-03-01', endDate: '2026-03-31'
  },
  {
    id: '6', name: 'TikTok Influencer Collab', platform: 'tiktok', status: 'paused',
    budget: 4000, spent: 2100, impressions: 680000, clicks: 20400,
    conversions: 150, ctr: 3.0, cpc: 0.10, cpa: 14.0, roas: 2.4,
    startDate: '2026-02-20', endDate: '2026-03-20'
  },
  {
    id: '7', name: 'Google Display Network', platform: 'google', status: 'active',
    budget: 3500, spent: 2180, impressions: 420000, clicks: 5040,
    conversions: 120, ctr: 1.2, cpc: 0.43, cpa: 18.17, roas: 2.1,
    startDate: '2026-03-01', endDate: '2026-04-01'
  },
  {
    id: '8', name: 'Snapchat AR Lens Promo', platform: 'snapchat', status: 'completed',
    budget: 5000, spent: 5000, impressions: 890000, clicks: 17800,
    conversions: 320, ctr: 2.0, cpc: 0.28, cpa: 15.63, roas: 3.2,
    startDate: '2026-02-01', endDate: '2026-02-28'
  },
  {
    id: '9', name: 'Facebook Lead Gen', platform: 'facebook', status: 'draft',
    budget: 6000, spent: 0, impressions: 0, clicks: 0,
    conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0,
    startDate: '2026-04-01', endDate: '2026-04-30'
  },
  {
    id: '10', name: 'Google Shopping Ads', platform: 'google', status: 'active',
    budget: 10000, spent: 7200, impressions: 350000, clicks: 21000,
    conversions: 890, ctr: 6.0, cpc: 0.34, cpa: 8.09, roas: 7.2,
    startDate: '2026-03-01', endDate: '2026-03-31'
  }
];

export const recommendations: Recommendation[] = [
  {
    id: 'r1', campaignId: '1', campaignName: 'Summer Sale 2026', platform: 'facebook',
    type: 'budget', priority: 'high',
    title: 'Increase budget by 30% for Summer Sale campaign',
    description: 'This campaign has a strong ROAS of 4.2x and is spending efficiently. Increasing budget could capture more conversions while maintaining performance. Current daily spend is well below the target audience capacity.',
    expectedImpact: '+102 conversions, +$3,400 revenue estimated',
    status: 'pending', createdAt: '2026-03-18T10:00:00Z'
  },
  {
    id: 'r2', campaignId: '4', campaignName: 'Snap Story Ads', platform: 'snapchat',
    type: 'creative', priority: 'high',
    title: 'Refresh ad creatives - engagement declining',
    description: 'CTR has dropped 15% over the past week, suggesting ad fatigue. Consider introducing new video creatives or testing different hooks in the first 3 seconds to recapture audience attention.',
    expectedImpact: '+0.5% CTR improvement, -$2.10 CPA reduction',
    status: 'pending', createdAt: '2026-03-18T09:30:00Z'
  },
  {
    id: 'r3', campaignId: '7', campaignName: 'Google Display Network', platform: 'google',
    type: 'targeting', priority: 'medium',
    title: 'Narrow audience targeting to reduce wasted spend',
    description: 'The Display Network campaign has a low CTR of 1.2% and high CPA of $18.17. Recommend excluding low-performing placements and adding more specific audience segments to improve efficiency.',
    expectedImpact: '-35% CPA reduction, +1.5x ROAS improvement',
    status: 'pending', createdAt: '2026-03-17T15:00:00Z'
  },
  {
    id: 'r4', campaignId: '6', campaignName: 'TikTok Influencer Collab', platform: 'tiktok',
    type: 'bidding', priority: 'medium',
    title: 'Switch to value-based bidding strategy',
    description: 'Current CPA-based bidding is not optimizing for high-value conversions. Switching to value-based bidding could improve ROAS from 2.4x to an estimated 3.5x by prioritizing users with higher purchase intent.',
    expectedImpact: '+$1,200 revenue with same spend',
    status: 'pending', createdAt: '2026-03-17T12:00:00Z'
  },
  {
    id: 'r5', campaignId: '10', campaignName: 'Google Shopping Ads', platform: 'google',
    type: 'budget', priority: 'low',
    title: 'Reallocate budget from Display to Shopping',
    description: 'Google Shopping Ads are performing at 7.2x ROAS vs 2.1x for Display Network. Consider shifting 20% of Display budget to Shopping to maximize overall return.',
    expectedImpact: '+$5,800 additional revenue estimated',
    status: 'pending', createdAt: '2026-03-16T08:00:00Z'
  },
  {
    id: 'r6', campaignId: '2', campaignName: 'Brand Awareness TikTok', platform: 'tiktok',
    type: 'schedule', priority: 'low',
    title: 'Optimize ad scheduling for peak hours',
    description: 'Data shows 68% of conversions occur between 6PM-11PM. Concentrating budget during peak hours could improve efficiency by reducing spend during low-converting periods.',
    expectedImpact: '-12% CPA, +18% conversion rate during peak',
    status: 'applied', createdAt: '2026-03-15T14:00:00Z'
  }
];

export const platformMetrics: PlatformMetrics[] = [
  { platform: 'facebook', totalSpend: 5290, totalImpressions: 330000, totalClicks: 12450, totalConversions: 620, avgCTR: 3.77, avgCPC: 0.42, avgROAS: 5.2, campaigns: 3 },
  { platform: 'tiktok', totalSpend: 3990, totalImpressions: 1200000, totalClicks: 36000, totalConversions: 360, avgCTR: 3.0, avgCPC: 0.11, avgROAS: 3.1, campaigns: 2 },
  { platform: 'google', totalSpend: 15020, totalImpressions: 950000, totalClicks: 38640, totalConversions: 1590, avgCTR: 4.07, avgCPC: 0.39, avgROAS: 4.8, campaigns: 3 },
  { platform: 'snapchat', totalSpend: 6240, totalImpressions: 1200000, totalClicks: 24000, totalConversions: 415, avgCTR: 2.0, avgCPC: 0.26, avgROAS: 3.05, campaigns: 2 }
];

export const dailyMetrics: DailyMetric[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, i + 1);
  const base = 800 + Math.sin(i * 0.3) * 200 + Math.random() * 150;
  return {
    date: date.toISOString().split('T')[0],
    impressions: Math.round(38000 + Math.sin(i * 0.5) * 8000 + Math.random() * 5000),
    clicks: Math.round(1200 + Math.sin(i * 0.4) * 300 + Math.random() * 200),
    conversions: Math.round(45 + Math.sin(i * 0.3) * 15 + Math.random() * 10),
    spend: Math.round(base * 100) / 100,
    revenue: Math.round(base * (3.5 + Math.random()) * 100) / 100,
  };
});

export const aiChatSuggestions = [
  "Which campaign has the best ROAS this month?",
  "How can I reduce CPA on my Snapchat campaigns?",
  "Compare Facebook vs TikTok performance",
  "What's the optimal budget split across platforms?",
  "Show me underperforming campaigns that need attention",
  "Predict next week's performance based on current trends"
];
