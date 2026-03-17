import React, { useState, useEffect } from 'react';

function ConfigureStage({ config, onSubmit, apiBase }) {
  const [form, setForm] = useState(config);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [apiBase]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="card">
      <h2 className="card-title">Configure Your Scan</h2>
      <p style={{ color: '#718096', marginBottom: 24, fontSize: 14 }}>
        Target low-rated businesses on Trustpilot that could benefit from reputation management services.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Search Query</label>
          <input
            type="text"
            placeholder="e.g. restaurant, plumber, dentist, hotel..."
            value={form.query}
            onChange={(e) => handleChange('query', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Or Select a Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Min Rating (Stars)</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={form.minRating}
              onChange={(e) => handleChange('minRating', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Max Rating (Stars)</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={form.maxRating}
              onChange={(e) => handleChange('maxRating', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Pages to Scan (more pages = more results, slower scan)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={form.pages}
            onChange={(e) => handleChange('pages', parseInt(e.target.value))}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!form.query && !form.category}
        >
          Start Scanning &#8594;
        </button>
      </form>
    </div>
  );
}

export default ConfigureStage;
