import React from 'react';

function DoneStage({ results, totalLeads, onReset }) {
  const sent = results?.sent || 0;
  const failed = results?.failed || 0;
  const expectedOpenRate = Math.round(sent * 0.35);
  const expectedReplyRate = Math.round(sent * 0.08);

  return (
    <div className="card">
      <div className="done-container">
        <div className="done-icon">&#10003;</div>
        <h2 className="done-title">Campaign Complete!</h2>
        <p className="done-subtitle">
          Your outreach emails have been sent successfully.
        </p>

        <div className="stats-grid" style={{ maxWidth: 600, margin: '0 auto 30px' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#38a169' }}>{sent}</div>
            <div className="stat-label">Emails Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: failed > 0 ? '#e53e3e' : '#38a169' }}>{failed}</div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ecc94b' }}>~{expectedOpenRate}</div>
            <div className="stat-label">Expected Opens (35%)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#00d4aa' }}>~{expectedReplyRate}</div>
            <div className="stat-label">Expected Replies (8%)</div>
          </div>
        </div>

        {results?.errors && results.errors.length > 0 && (
          <div style={{ textAlign: 'left', marginTop: 20 }}>
            <h4 style={{ color: '#e53e3e', marginBottom: 10, fontSize: 14 }}>Failed Sends:</h4>
            <div style={{ background: '#0f0f1a', borderRadius: 8, padding: 16, fontSize: 12, maxHeight: 150, overflowY: 'auto' }}>
              {results.errors.map((err, i) => (
                <div key={i} style={{ color: '#fc8181', padding: '4px 0' }}>
                  {err.business}: {err.error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          <h4 style={{ color: '#a0aec0', marginBottom: 16, fontSize: 14 }}>What's Next?</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ background: '#141425', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>&#128232;</div>
              <div style={{ fontSize: 12, color: '#a0aec0' }}>Monitor inbox for replies</div>
            </div>
            <div style={{ background: '#141425', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>&#128197;</div>
              <div style={{ fontSize: 12, color: '#a0aec0' }}>Follow up in 3-5 days</div>
            </div>
            <div style={{ background: '#141425', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>&#128200;</div>
              <div style={{ fontSize: 12, color: '#a0aec0' }}>Track conversion rate</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onReset} style={{ marginTop: 40 }}>
          Start New Campaign
        </button>
      </div>
    </div>
  );
}

export default DoneStage;
