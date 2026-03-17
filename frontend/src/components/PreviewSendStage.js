import React, { useState, useEffect, useRef } from 'react';

function PreviewSendStage({ businesses, selectedLeads, smtpConfig, setSmtpConfig, apiBase, onComplete }) {
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(null);
  const iframeRef = useRef(null);

  const selectedBusinesses = selectedLeads.map(i => businesses[i]).filter(Boolean);
  const currentBusiness = selectedBusinesses[previewIndex] || selectedBusinesses[0];

  useEffect(() => {
    if (!currentBusiness) return;
    fetch(`${apiBase}/api/email/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business: currentBusiness,
        senderName: smtpConfig.senderName,
        senderCompany: smtpConfig.senderCompany,
      }),
    })
      .then(r => r.json())
      .then(data => setPreviewHtml(data.html || ''))
      .catch(() => setPreviewHtml('<p>Preview unavailable</p>'));
  }, [currentBusiness, smtpConfig.senderName, smtpConfig.senderCompany, apiBase]);

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(previewHtml);
      doc.close();
    }
  }, [previewHtml]);

  const handleConfigChange = (field, value) => {
    setSmtpConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSend = async () => {
    if (!smtpConfig.user || !smtpConfig.pass) {
      alert('Please enter SMTP credentials before sending.');
      return;
    }

    const leadsWithEmail = selectedBusinesses.filter(b => b.email);
    if (leadsWithEmail.length === 0) {
      alert('No selected leads have email addresses.');
      return;
    }

    setSending(true);
    setSendProgress({ sent: 0, total: leadsWithEmail.length });

    try {
      const res = await fetch(`${apiBase}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leadsWithEmail,
          smtpConfig: smtpConfig,
        }),
      });
      const results = await res.json();
      if (results.error) {
        alert(`Error: ${results.error}`);
        setSending(false);
        return;
      }
      onComplete(results);
    } catch (err) {
      alert(`Send failed: ${err.message}`);
      setSending(false);
    }
  };

  return (
    <div>
      {/* SMTP Configuration */}
      <div className="card">
        <h2 className="card-title">Email Configuration</h2>
        <div className="smtp-config">
          <div className="form-group">
            <label>SMTP Host</label>
            <input
              type="text"
              value={smtpConfig.host}
              onChange={(e) => handleConfigChange('host', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="form-group">
            <label>SMTP Port</label>
            <input
              type="number"
              value={smtpConfig.port}
              onChange={(e) => handleConfigChange('port', e.target.value)}
              placeholder="587"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={smtpConfig.user}
              onChange={(e) => handleConfigChange('user', e.target.value)}
              placeholder="you@gmail.com"
            />
          </div>
          <div className="form-group">
            <label>App Password</label>
            <input
              type="password"
              value={smtpConfig.pass}
              onChange={(e) => handleConfigChange('pass', e.target.value)}
              placeholder="16-character app password"
            />
          </div>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={smtpConfig.senderName}
              onChange={(e) => handleConfigChange('senderName', e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={smtpConfig.senderCompany}
              onChange={(e) => handleConfigChange('senderCompany', e.target.value)}
              placeholder="Review Acceleration Co."
            />
          </div>
        </div>
      </div>

      {/* Email Preview */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            Email Preview ({previewIndex + 1} of {selectedBusinesses.length})
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
              disabled={previewIndex === 0}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              &#8592; Prev
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPreviewIndex(Math.min(selectedBusinesses.length - 1, previewIndex + 1))}
              disabled={previewIndex >= selectedBusinesses.length - 1}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Next &#8594;
            </button>
          </div>
        </div>

        {currentBusiness && (
          <div style={{ marginBottom: 16, fontSize: 13, color: '#a0aec0' }}>
            <strong style={{ color: '#e2e8f0' }}>To:</strong> {currentBusiness.email || 'No email'} &nbsp;|&nbsp;
            <strong style={{ color: '#e2e8f0' }}>Subject:</strong> {currentBusiness.name} — Improve Your {currentBusiness.rating} Star Rating on Trustpilot
          </div>
        )}

        <div className="email-preview">
          <iframe ref={iframeRef} title="Email Preview" />
        </div>
      </div>

      {/* Send Controls */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#a0aec0', fontSize: 14 }}>
              Ready to send to <strong style={{ color: '#00d4aa' }}>{selectedBusinesses.filter(b => b.email).length}</strong> leads with email addresses
            </p>
            {selectedBusinesses.filter(b => !b.email).length > 0 && (
              <p style={{ color: '#ed8936', fontSize: 12, marginTop: 4 }}>
                {selectedBusinesses.filter(b => !b.email).length} leads will be skipped (no email)
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || !smtpConfig.user || !smtpConfig.pass}
            style={{ fontSize: 16, padding: '14px 32px' }}
          >
            {sending ? `Sending... (${sendProgress?.sent || 0}/${sendProgress?.total || 0})` : 'Send All Emails'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewSendStage;
