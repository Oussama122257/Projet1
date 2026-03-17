const axios = require('axios');
const cheerio = require('cheerio');

const TRUSTPILOT_BASE = 'https://www.trustpilot.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

// Delay helper to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrape Trustpilot category page for businesses
async function scrapeCategory(category, options = {}) {
  const {
    minRating = 1,
    maxRating = 3,
    pages = 3,
    onProgress = null,
  } = options;

  const businesses = [];
  let totalFound = 0;

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${TRUSTPILOT_BASE}/categories/${category}?page=${page}`;
      if (onProgress) onProgress({ stage: 'scanning', page, totalPages: pages, message: `Scanning page ${page}/${pages}...` });

      const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(response.data);

      // Parse business cards from the category page
      const cards = $('[class*="business-unit-card"], [data-business-unit-card], .styles_businessUnitCard__')
        .toArray();

      // Also try JSON-LD structured data
      const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse($(script).html());
          if (data['@type'] === 'ItemList' && data.itemListElement) {
            for (const item of data.itemListElement) {
              const org = item.item;
              if (org && org['@type'] === 'Organization') {
                const rating = org.aggregateRating?.ratingValue || 0;
                if (rating >= minRating && rating <= maxRating) {
                  businesses.push({
                    name: org.name || 'Unknown',
                    domain: org.url || '',
                    trustpilotUrl: org.url || '',
                    rating: parseFloat(rating),
                    reviewCount: org.aggregateRating?.reviewCount || 0,
                    category: category,
                    location: '',
                    email: '',
                    joinDate: '',
                  });
                  totalFound++;
                }
              }
            }
          }
        } catch (e) {
          // Skip malformed JSON-LD
        }
      }

      // Parse from HTML if JSON-LD didn't yield results
      if (cards.length > 0 && businesses.length === 0) {
        for (const card of cards) {
          const $card = $(card);
          const name = $card.find('[class*="displayName"], [class*="businessName"]').text().trim();
          const ratingText = $card.find('[class*="ratingScore"], [class*="star-rating"]').text().trim();
          const rating = parseFloat(ratingText) || 0;
          const reviewText = $card.find('[class*="reviewCount"]').text().trim();
          const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, '')) || 0;
          const link = $card.find('a[href*="/review/"]').attr('href') || '';
          const domain = link.replace('/review/', '').replace(/\/$/, '');

          if (rating >= minRating && rating <= maxRating && name) {
            businesses.push({
              name,
              domain,
              trustpilotUrl: link ? `${TRUSTPILOT_BASE}${link}` : '',
              rating,
              reviewCount,
              category,
              location: '',
              email: '',
              joinDate: '',
            });
            totalFound++;
          }
        }
      }

      // Try alternative HTML structure
      $('a[name="business-unit-card"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('p[class*="displayName"]').text().trim()
          || $el.find('[data-business-unit-name]').text().trim();
        const ratingStr = $el.attr('href') || '';
        const domain = ratingStr.replace('/review/', '').replace(/\/$/, '');

        if (name && !businesses.find(b => b.name === name)) {
          businesses.push({
            name,
            domain,
            trustpilotUrl: `${TRUSTPILOT_BASE}${ratingStr}`,
            rating: 0,
            reviewCount: 0,
            category,
            location: '',
            email: '',
            joinDate: '',
          });
          totalFound++;
        }
      });

      if (onProgress) onProgress({ stage: 'scanning', page, totalPages: pages, found: totalFound, message: `Found ${totalFound} businesses so far...` });

      await delay(1500 + Math.random() * 1500);
    } catch (error) {
      console.error(`Error scraping page ${page}:`, error.message);
      if (onProgress) onProgress({ stage: 'error', message: `Error on page ${page}: ${error.message}` });
    }
  }

  return businesses;
}

// Scrape individual Trustpilot business profile for details
async function scrapeBusinessProfile(businessUrl) {
  try {
    const url = businessUrl.startsWith('http') ? businessUrl : `${TRUSTPILOT_BASE}/review/${businessUrl}`;
    const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(response.data);

    const details = {};

    // Extract rating from JSON-LD
    const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse($(script).html());
        if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') {
          details.rating = data.aggregateRating?.ratingValue || 0;
          details.reviewCount = data.aggregateRating?.reviewCount || 0;
          details.name = data.name || '';
          details.location = data.address?.addressCountry || '';
        }
      } catch (e) { /* skip */ }
    }

    // Extract from meta tags
    details.name = details.name || $('meta[property="og:title"]').attr('content')?.split('|')[0]?.trim() || '';
    details.location = details.location || $('[class*="location"], [data-business-location]').text().trim() || '';

    // Extract join date
    const joinDateEl = $('[class*="since"], [class*="joined"], [class*="memberSince"]');
    details.joinDate = joinDateEl.text().replace(/.*since|joined/i, '').trim() || '';

    // Try to find website URL
    const websiteLink = $('a[class*="website"], a[data-website-link], a[href*="redirect"]')
      .filter((_, el) => {
        const href = $(el).attr('href') || '';
        return href.includes('redirect') || href.includes('website');
      })
      .first()
      .attr('href') || '';

    details.websiteUrl = websiteLink;

    return details;
  } catch (error) {
    console.error(`Error scraping profile ${businessUrl}:`, error.message);
    return {};
  }
}

// Extract emails from a business website
async function extractEmailsFromWebsite(domain) {
  if (!domain) return [];
  const emails = new Set();
  const pagesToCheck = ['', '/contact', '/contact-us', '/about', '/about-us', '/impressum', '/privacy-policy'];

  for (const path of pagesToCheck) {
    try {
      const url = `https://${domain}${path}`;
      const response = await axios.get(url, {
        headers: { ...HEADERS, 'Accept': 'text/html' },
        timeout: 8000,
        maxRedirects: 3,
      });

      const html = response.data;
      if (typeof html !== 'string') continue;

      // Extract emails from HTML
      const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = html.match(emailRegex) || [];

      // Also check mailto: links
      const $ = cheerio.load(html);
      $('a[href^="mailto:"]').each((_, el) => {
        const mailto = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
        if (mailto) emails.add(mailto.toLowerCase());
      });

      for (const email of foundEmails) {
        const lower = email.toLowerCase();
        // Filter out common non-contact emails and image files
        if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.gif')
          && !lower.endsWith('.svg') && !lower.includes('example.com')
          && !lower.includes('sentry.io') && !lower.includes('wixpress')
          && !lower.includes('@2x') && !lower.includes('webpack')) {
          emails.add(lower);
        }
      }

      if (emails.size > 0) break; // Found emails, no need to check more pages
      await delay(500);
    } catch (error) {
      // Page not accessible, try next
    }
  }

  return [...emails];
}

// Search Trustpilot with a query string
async function searchTrustpilot(query, options = {}) {
  const { pages = 2, minRating = 1, maxRating = 3, onProgress = null } = options;
  const businesses = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${TRUSTPILOT_BASE}/search?query=${encodeURIComponent(query)}&page=${page}`;
      if (onProgress) onProgress({ stage: 'searching', page, totalPages: pages, message: `Searching "${query}" page ${page}...` });

      const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(response.data);

      // Parse search results
      $('[class*="searchResult"], [class*="result"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('[class*="displayName"], [class*="name"]').first().text().trim();
        const link = $el.find('a[href*="/review/"]').first().attr('href') || '';
        const domain = link.replace('/review/', '').replace(/\/$/, '');
        const ratingStr = $el.find('[class*="ratingScore"], [class*="rating"]').first().text().trim();
        const rating = parseFloat(ratingStr) || 0;
        const reviewStr = $el.find('[class*="reviewCount"]').first().text().trim();
        const reviewCount = parseInt(reviewStr.replace(/[^0-9]/g, '')) || 0;

        if (name && rating >= minRating && rating <= maxRating) {
          businesses.push({
            name,
            domain,
            trustpilotUrl: link ? `${TRUSTPILOT_BASE}${link}` : '',
            rating,
            reviewCount,
            category: query,
            location: '',
            email: '',
            joinDate: '',
          });
        }
      });

      // Parse JSON-LD from search results
      $('script[type="application/ld+json"]').each((_, script) => {
        try {
          const data = JSON.parse($(script).html());
          if (data.itemListElement) {
            for (const item of data.itemListElement) {
              const org = item.item;
              if (org?.['@type'] === 'Organization') {
                const rating = parseFloat(org.aggregateRating?.ratingValue) || 0;
                if (rating >= minRating && rating <= maxRating) {
                  const existing = businesses.find(b => b.name === org.name);
                  if (!existing) {
                    businesses.push({
                      name: org.name || 'Unknown',
                      domain: (org.url || '').replace('https://', '').replace('http://', '').replace(/\/$/, ''),
                      trustpilotUrl: org.url || '',
                      rating,
                      reviewCount: parseInt(org.aggregateRating?.reviewCount) || 0,
                      category: query,
                      location: '',
                      email: '',
                      joinDate: '',
                    });
                  }
                }
              }
            }
          }
        } catch (e) { /* skip */ }
      });

      await delay(1500 + Math.random() * 1500);
    } catch (error) {
      console.error(`Search error page ${page}:`, error.message);
    }
  }

  return businesses;
}

// Full pipeline: search → profile details → email extraction
async function fullScan(query, options = {}) {
  const { category, minRating = 1, maxRating = 3, pages = 3, onProgress = null } = options;

  // Stage 1: Find businesses
  let businesses;
  if (category) {
    businesses = await scrapeCategory(category, { minRating, maxRating, pages, onProgress });
  } else {
    businesses = await searchTrustpilot(query || 'restaurant', { minRating, maxRating, pages, onProgress });
  }

  if (onProgress) onProgress({ stage: 'enriching', message: `Enriching ${businesses.length} businesses...`, total: businesses.length, current: 0 });

  // Stage 2: Enrich each business
  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    if (onProgress) onProgress({ stage: 'enriching', message: `Enriching ${biz.name}...`, total: businesses.length, current: i + 1 });

    // Get profile details
    if (biz.trustpilotUrl || biz.domain) {
      const profile = await scrapeBusinessProfile(biz.trustpilotUrl || biz.domain);
      Object.assign(biz, {
        rating: biz.rating || profile.rating || 0,
        reviewCount: biz.reviewCount || profile.reviewCount || 0,
        location: biz.location || profile.location || '',
        joinDate: biz.joinDate || profile.joinDate || '',
        name: biz.name || profile.name || 'Unknown',
      });
    }

    // Extract emails from their website
    if (biz.domain) {
      const emails = await extractEmailsFromWebsite(biz.domain);
      biz.email = emails[0] || '';
      biz.allEmails = emails;
    }

    await delay(800);
  }

  if (onProgress) onProgress({ stage: 'complete', message: `Scan complete! Found ${businesses.length} businesses.`, businesses });

  return businesses;
}

module.exports = {
  scrapeCategory,
  scrapeBusinessProfile,
  extractEmailsFromWebsite,
  searchTrustpilot,
  fullScan,
};
