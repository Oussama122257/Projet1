require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { fullScan, scrapeCategory, searchTrustpilot, scrapeBusinessProfile, extractEmailsFromWebsite } = require('./scraper');
const { sendBatchEmails, generateEmailHTML, generatePlainText } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

// Store active scans for SSE
const activeScans = new Map();

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available Trustpilot categories
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 'animals_pets', name: 'Animals & Pets' },
    { id: 'beauty_wellbeing', name: 'Beauty & Well-being' },
    { id: 'business_services', name: 'Business Services' },
    { id: 'construction_manufacturing', name: 'Construction & Manufacturing' },
    { id: 'education_training', name: 'Education & Training' },
    { id: 'electronics_technology', name: 'Electronics & Technology' },
    { id: 'events_entertainment', name: 'Events & Entertainment' },
    { id: 'food_beverages_tobacco', name: 'Food, Beverages & Tobacco' },
    { id: 'health_medical', name: 'Health & Medical' },
    { id: 'hobbies_crafts', name: 'Hobbies & Crafts' },
    { id: 'home_garden', name: 'Home & Garden' },
    { id: 'home_services', name: 'Home Services' },
    { id: 'legal', name: 'Legal' },
    { id: 'media_publishing', name: 'Media & Publishing' },
    { id: 'money_insurance', name: 'Money & Insurance' },
    { id: 'public_local_services', name: 'Public & Local Services' },
    { id: 'restaurants_bars', name: 'Restaurants & Bars' },
    { id: 'shopping_fashion', name: 'Shopping & Fashion' },
    { id: 'sports', name: 'Sports' },
    { id: 'travel_vacation', name: 'Travel & Vacation' },
    { id: 'utilities', name: 'Utilities' },
    { id: 'vehicles_transportation', name: 'Vehicles & Transportation' },
  ];
  res.json(categories);
});

// Start a scan (returns scan ID, results stream via SSE)
app.post('/api/scan', async (req, res) => {
  const { query, category, minRating = 1, maxRating = 3, pages = 3 } = req.body;

  if (!query && !category) {
    return res.status(400).json({ error: 'Provide either a query or category' });
  }

  const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Store scan state
  activeScans.set(scanId, {
    status: 'running',
    progress: [],
    businesses: [],
    startedAt: new Date(),
  });

  // Run scan in background
  (async () => {
    try {
      const businesses = await fullScan(query, {
        category,
        minRating: parseFloat(minRating),
        maxRating: parseFloat(maxRating),
        pages: parseInt(pages),
        onProgress: (progress) => {
          const scan = activeScans.get(scanId);
          if (scan) {
            scan.progress.push(progress);
            scan.lastProgress = progress;
          }
        },
      });

      const scan = activeScans.get(scanId);
      if (scan) {
        scan.status = 'complete';
        scan.businesses = businesses;
        scan.completedAt = new Date();
      }
    } catch (error) {
      const scan = activeScans.get(scanId);
      if (scan) {
        scan.status = 'error';
        scan.error = error.message;
      }
    }
  })();

  res.json({ scanId, message: 'Scan started' });
});

// SSE endpoint for real-time scan progress
app.get('/api/scan/:scanId/stream', (req, res) => {
  const { scanId } = req.params;
  const scan = activeScans.get(scanId);

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let lastIndex = 0;
  const interval = setInterval(() => {
    const currentScan = activeScans.get(scanId);
    if (!currentScan) {
      clearInterval(interval);
      res.end();
      return;
    }

    // Send new progress events
    while (lastIndex < currentScan.progress.length) {
      res.write(`data: ${JSON.stringify(currentScan.progress[lastIndex])}\n\n`);
      lastIndex++;
    }

    // Send completion event
    if (currentScan.status === 'complete') {
      res.write(`data: ${JSON.stringify({ stage: 'complete', businesses: currentScan.businesses })}\n\n`);
      clearInterval(interval);
      res.end();
    } else if (currentScan.status === 'error') {
      res.write(`data: ${JSON.stringify({ stage: 'error', message: currentScan.error })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Get scan status/results
app.get('/api/scan/:scanId', (req, res) => {
  const { scanId } = req.params;
  const scan = activeScans.get(scanId);

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  res.json({
    scanId,
    status: scan.status,
    businessCount: scan.businesses.length,
    businesses: scan.businesses,
    lastProgress: scan.lastProgress,
    startedAt: scan.startedAt,
    completedAt: scan.completedAt,
  });
});

// Quick search (non-streaming, returns results directly)
app.get('/api/search', async (req, res) => {
  const { q, category, minRating = 1, maxRating = 3, pages = 2 } = req.query;

  if (!q && !category) {
    return res.status(400).json({ error: 'Provide q (query) or category parameter' });
  }

  try {
    let businesses;
    if (category) {
      businesses = await scrapeCategory(category, {
        minRating: parseFloat(minRating),
        maxRating: parseFloat(maxRating),
        pages: parseInt(pages),
      });
    } else {
      businesses = await searchTrustpilot(q, {
        minRating: parseFloat(minRating),
        maxRating: parseFloat(maxRating),
        pages: parseInt(pages),
      });
    }
    res.json({ count: businesses.length, businesses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scrape a single business profile
app.get('/api/business/:domain', async (req, res) => {
  try {
    const profile = await scrapeBusinessProfile(req.params.domain);
    const emails = await extractEmailsFromWebsite(req.params.domain);
    res.json({ ...profile, emails, domain: req.params.domain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extract emails from a domain
app.get('/api/emails/:domain', async (req, res) => {
  try {
    const emails = await extractEmailsFromWebsite(req.params.domain);
    res.json({ domain: req.params.domain, emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview email template for a business
app.post('/api/email/preview', (req, res) => {
  const { business, senderName, senderCompany } = req.body;
  if (!business) return res.status(400).json({ error: 'Business data required' });

  const html = generateEmailHTML(business, senderName, senderCompany);
  const text = generatePlainText(business, senderName, senderCompany);
  res.json({ html, text });
});

// Send emails to selected leads
app.post('/api/email/send', async (req, res) => {
  const { leads, smtpConfig } = req.body;

  if (!leads || !leads.length) {
    return res.status(400).json({ error: 'No leads provided' });
  }

  const config = {
    smtpHost: smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: smtpConfig?.port || process.env.SMTP_PORT || 587,
    smtpUser: smtpConfig?.user || process.env.SMTP_USER,
    smtpPass: smtpConfig?.pass || process.env.SMTP_PASS,
    senderName: smtpConfig?.senderName || process.env.SENDER_NAME || 'Review Team',
    senderCompany: smtpConfig?.senderCompany || process.env.SENDER_COMPANY || 'Review Acceleration',
  };

  if (!config.smtpUser || !config.smtpPass) {
    return res.status(400).json({ error: 'SMTP credentials required. Set SMTP_USER/SMTP_PASS env vars or pass in smtpConfig.' });
  }

  try {
    const results = await sendBatchEmails(config, leads);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export leads as CSV
app.post('/api/export/csv', (req, res) => {
  const { leads } = req.body;
  if (!leads || !leads.length) {
    return res.status(400).json({ error: 'No leads to export' });
  }

  const headers = ['Name', 'Domain', 'Rating', 'Reviews', 'Category', 'Location', 'Email', 'Join Date', 'Trustpilot URL'];
  const csvRows = [headers.join(',')];

  for (const lead of leads) {
    const row = [
      `"${(lead.name || '').replace(/"/g, '""')}"`,
      lead.domain || '',
      lead.rating || '',
      lead.reviewCount || '',
      `"${(lead.category || '').replace(/"/g, '""')}"`,
      `"${(lead.location || '').replace(/"/g, '""')}"`,
      lead.email || '',
      `"${(lead.joinDate || '').replace(/"/g, '""')}"`,
      lead.trustpilotUrl || '',
    ];
    csvRows.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=trustpilot-leads-${Date.now()}.csv`);
  res.send(csvRows.join('\n'));
});

// Cleanup old scans (runs every 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [scanId, scan] of activeScans) {
    if (now - scan.startedAt.getTime() > 3600000) { // 1 hour
      activeScans.delete(scanId);
    }
  }
}, 1800000);

// Serve React app for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Trustpilot Outreach Agent running on port ${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api/health`);
  console.log(`   Frontend: http://localhost:${PORT}\n`);
});
