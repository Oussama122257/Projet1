import React, { useMemo } from 'react';

function StarDisplay({ rating }) {
  const r = parseFloat(rating) || 0;
  const cls = r <= 2 ? 'low' : r <= 3.5 ? 'medium' : 'high';
  return <span className={`stars ${cls}`}>{'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))} {r.toFixed(1)}</span>;
}

function ReviewStage({ businesses, selectedLeads, setSelectedLeads, onNext, apiBase }) {
  const allSelected = selectedLeads.length === businesses.length;
  const withEmail = useMemo(() => businesses.filter(b => b.email).length, [businesses]);

  const toggleSelect = (index) => {
    setSelectedLeads(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    setSelectedLeads(allSelected ? [] : businesses.map((_, i) => i));
  };

  const handleExportCSV = async () => {
    const selected = selectedLeads.map(i => businesses[i]);
    try {
      const res = await fetch(`${apiBase}/api/export/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: selected }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustpilot-leads-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: client-side CSV generation
      const headers = ['Name', 'Domain', 'Rating', 'Reviews', 'Category', 'Location', 'Email', 'Join Date'];
      const rows = selected.map(b => [
        `"${(b.name || '').replace(/"/g, '""')}"`,
        b.domain, b.rating, b.reviewCount,
        `"${b.category || ''}"`, `"${b.location || ''}"`,
        b.email, `"${b.joinDate || ''}"`,
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustpilot-leads-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Review & Export Leads</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{businesses.length}</div>
          <div className="stat-label">Total Found</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{withEmail}</div>
          <div className="stat-label">With Email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{selectedLeads.length}</div>
          <div className="stat-label">Selected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {businesses.length > 0 ? (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length).toFixed(1) : '0'}
          </div>
          <div className="stat-label">Avg Rating</div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th>Business</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Category</th>
              <th>Email</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((biz, i) => (
              <tr key={i}>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(i)}
                    onChange={() => toggleSelect(i)}
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{biz.name}</div>
                  <div style={{ fontSize: 11, color: '#718096' }}>{biz.domain}</div>
                </td>
                <td><StarDisplay rating={biz.rating} /></td>
                <td>{biz.reviewCount || 0}</td>
                <td>
                  <span className="badge badge-secondary" style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa' }}>
                    {biz.category || '-'}
                  </span>
                </td>
                <td>
                  {biz.email ? (
                    <span className="badge badge-success">{biz.email}</span>
                  ) : (
                    <span className="badge badge-warning">Not found</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: '#a0aec0' }}>{biz.location || '-'}</td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#718096' }}>
                  No businesses found. Try adjusting your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleExportCSV} disabled={selectedLeads.length === 0}>
          Export CSV ({selectedLeads.length})
        </button>
        <button className="btn btn-primary" onClick={() => onNext(selectedLeads)} disabled={selectedLeads.length === 0}>
          Continue to Email Preview &#8594;
        </button>
      </div>
    </div>
  );
}

export default ReviewStage;
