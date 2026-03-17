const nodemailer = require('nodemailer');

function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.smtpHost || 'smtp.gmail.com',
    port: parseInt(config.smtpPort) || 587,
    secure: parseInt(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

function generateEmailHTML(business, senderName, senderCompany) {
  const projectedRating = Math.min(5, (business.rating || 2) + 1.5).toFixed(1);
  const projectedReviews = (business.reviewCount || 10) + 50;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0 0 8px; }
    .header p { color: #a0aec0; font-size: 14px; margin: 0; }
    .body { padding: 30px; }
    .greeting { font-size: 16px; color: #2d3748; margin-bottom: 20px; line-height: 1.6; }
    .stats-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .stats-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .stat-label { color: #718096; font-size: 14px; }
    .stat-current { color: #e53e3e; font-weight: 600; font-size: 14px; }
    .stat-projected { color: #38a169; font-weight: 600; font-size: 14px; }
    .arrow { color: #718096; margin: 0 8px; }
    .features { margin: 25px 0; }
    .feature { display: flex; align-items: flex-start; margin: 12px 0; }
    .feature-icon { width: 24px; height: 24px; min-width: 24px; background: #38a169; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; margin-right: 12px; margin-top: 2px; }
    .feature-text { color: #4a5568; font-size: 14px; line-height: 1.5; }
    .feature-text strong { color: #2d3748; }
    .cta-container { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #38a169, #2f855a); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; }
    .footer { background: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #a0aec0; font-size: 12px; margin: 4px 0; }
    .unsubscribe { color: #a0aec0; font-size: 11px; margin-top: 10px; }
    .unsubscribe a { color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Review Acceleration Program</h1>
      <p>Tailored for ${business.name}</p>
    </div>
    <div class="body">
      <div class="greeting">
        <p>Hi ${business.name} team,</p>
        <p>I noticed your Trustpilot profile and wanted to reach out. With a current rating of <strong>${business.rating || 'N/A'}</strong> across <strong>${business.reviewCount || 0} reviews</strong>, there's a significant opportunity to improve your online reputation and drive more customers to your business.</p>
      </div>

      <div class="stats-box">
        <h3 style="margin: 0 0 15px; color: #2d3748; font-size: 16px;">Your Projected Growth</h3>
        <table width="100%" cellpadding="6" cellspacing="0">
          <tr>
            <td style="color: #718096; font-size: 14px;">Rating</td>
            <td style="color: #e53e3e; font-weight: 600; font-size: 14px; text-align: center;">${business.rating || 'N/A'} ★</td>
            <td style="color: #718096; text-align: center;">→</td>
            <td style="color: #38a169; font-weight: 600; font-size: 14px; text-align: right;">${projectedRating} ★</td>
          </tr>
          <tr>
            <td style="color: #718096; font-size: 14px;">Reviews</td>
            <td style="color: #e53e3e; font-weight: 600; font-size: 14px; text-align: center;">${business.reviewCount || 0}</td>
            <td style="color: #718096; text-align: center;">→</td>
            <td style="color: #38a169; font-weight: 600; font-size: 14px; text-align: right;">${projectedReviews}+</td>
          </tr>
        </table>
      </div>

      <div class="features">
        <h3 style="color: #2d3748; font-size: 16px;">What's Included:</h3>
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td width="30" valign="top" style="color: #38a169; font-weight: bold;">✓</td>
            <td style="color: #4a5568; font-size: 14px;"><strong>Authentic Review Generation</strong> — Automated follow-up sequences that encourage happy customers to share their experience</td>
          </tr>
          <tr>
            <td width="30" valign="top" style="color: #38a169; font-weight: bold;">✓</td>
            <td style="color: #4a5568; font-size: 14px;"><strong>Custom Response Strategy</strong> — Professional responses to all reviews, turning negatives into positives</td>
          </tr>
          <tr>
            <td width="30" valign="top" style="color: #38a169; font-weight: bold;">✓</td>
            <td style="color: #4a5568; font-size: 14px;"><strong>Reputation Dashboard</strong> — Real-time monitoring of your ratings across all platforms</td>
          </tr>
          <tr>
            <td width="30" valign="top" style="color: #38a169; font-weight: bold;">✓</td>
            <td style="color: #4a5568; font-size: 14px;"><strong>Competitor Analysis</strong> — Monthly benchmarking against top competitors in your space</td>
          </tr>
        </table>
      </div>

      <div class="cta-container">
        <a href="mailto:${senderCompany ? senderCompany.toLowerCase().replace(/\s+/g, '') + '@gmail.com' : 'reply'}?subject=Review Acceleration - ${encodeURIComponent(business.name)}" class="cta-button" style="color: #ffffff;">
          Book a Free Strategy Call
        </a>
      </div>

      <p style="color: #718096; font-size: 14px; line-height: 1.6;">
        We've helped businesses in the <strong>${business.category || 'your'}</strong> category increase their ratings by an average of 1.5 stars within 90 days. I'd love to show you how we can do the same for ${business.name}.
      </p>

      <p style="color: #4a5568; font-size: 14px; margin-top: 25px;">
        Best regards,<br>
        <strong>${senderName || 'The Team'}</strong><br>
        ${senderCompany || 'Review Acceleration Program'}
      </p>
    </div>
    <div class="footer">
      <p>${senderCompany || 'Review Acceleration Program'}</p>
      <p class="unsubscribe">
        <a href="#">Unsubscribe</a> | This email was sent because your business is listed on Trustpilot
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generatePlainText(business, senderName, senderCompany) {
  const projectedRating = Math.min(5, (business.rating || 2) + 1.5).toFixed(1);

  return `Hi ${business.name} team,

I noticed your Trustpilot profile — you currently have a ${business.rating || 'N/A'} star rating across ${business.reviewCount || 0} reviews.

There's a real opportunity to improve your online reputation. Our Review Acceleration Program helps businesses like yours:

- Generate authentic reviews from real customers
- Respond professionally to all reviews
- Monitor reputation across platforms
- Benchmark against competitors

We project we can help you reach a ${projectedRating} star rating within 90 days.

Would you be open to a quick 15-minute call to discuss?

Best regards,
${senderName || 'The Team'}
${senderCompany || 'Review Acceleration Program'}

---
Unsubscribe: Reply with "unsubscribe" to stop receiving these emails.`;
}

async function sendEmail(transporter, { from, to, business, senderName, senderCompany }) {
  const mailOptions = {
    from: `"${senderName || senderCompany || 'Review Acceleration'}" <${from}>`,
    to,
    subject: `${business.name} — Improve Your ${business.rating || ''} Star Rating on Trustpilot`,
    text: generatePlainText(business, senderName, senderCompany),
    html: generateEmailHTML(business, senderName, senderCompany),
  };

  return transporter.sendMail(mailOptions);
}

async function sendBatchEmails(config, leads, onProgress = null) {
  const transporter = createTransporter(config);
  const results = { sent: 0, failed: 0, errors: [] };

  // Verify SMTP connection
  try {
    await transporter.verify();
  } catch (error) {
    throw new Error(`SMTP connection failed: ${error.message}. Check your credentials.`);
  }

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    if (!lead.email) {
      results.failed++;
      results.errors.push({ business: lead.name, error: 'No email address' });
      continue;
    }

    try {
      await sendEmail(transporter, {
        from: config.smtpUser,
        to: lead.email,
        business: lead,
        senderName: config.senderName,
        senderCompany: config.senderCompany,
      });
      results.sent++;
      if (onProgress) onProgress({ sent: results.sent, failed: results.failed, total: leads.length, current: lead.name });
    } catch (error) {
      results.failed++;
      results.errors.push({ business: lead.name, email: lead.email, error: error.message });
    }

    // Rate limit: ~2 emails per second
    if (i < leads.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  transporter.close();
  return results;
}

module.exports = {
  createTransporter,
  generateEmailHTML,
  generatePlainText,
  sendEmail,
  sendBatchEmails,
};
