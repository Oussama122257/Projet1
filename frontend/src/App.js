import React, { useState, useCallback } from 'react';
import ProgressTracker from './components/ProgressTracker';
import ConfigureStage from './components/ConfigureStage';
import ScanStage from './components/ScanStage';
import ReviewStage from './components/ReviewStage';
import PreviewSendStage from './components/PreviewSendStage';
import DoneStage from './components/DoneStage';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

const STAGES = ['Configure', 'Scan', 'Review & Export', 'Preview & Send', 'Done'];

function App() {
  const [currentStage, setCurrentStage] = useState(0);
  const [config, setConfig] = useState({
    query: '',
    category: '',
    minRating: 1,
    maxRating: 3,
    pages: 3,
  });
  const [businesses, setBusinesses] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [scanId, setScanId] = useState(null);
  const [emailResults, setEmailResults] = useState(null);
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    pass: '',
    senderName: '',
    senderCompany: '',
  });

  const handleConfigSubmit = useCallback(async (cfg) => {
    setConfig(cfg);
    setCurrentStage(1);

    try {
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      setScanId(data.scanId);
    } catch (err) {
      console.error('Failed to start scan:', err);
    }
  }, []);

  const handleScanComplete = useCallback((results) => {
    setBusinesses(results);
    setSelectedLeads(results.map((_, i) => i));
    setCurrentStage(2);
  }, []);

  const handleReviewNext = useCallback((selected) => {
    setSelectedLeads(selected);
    setCurrentStage(3);
  }, []);

  const handleSendComplete = useCallback((results) => {
    setEmailResults(results);
    setCurrentStage(4);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStage(0);
    setBusinesses([]);
    setSelectedLeads([]);
    setScanId(null);
    setEmailResults(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">&#9733;</span>
            <h1>Trustpilot Outreach Agent</h1>
          </div>
          <p className="subtitle">Discover low-rated businesses &bull; Extract contacts &bull; Send personalized campaigns</p>
        </div>
      </header>

      <ProgressTracker stages={STAGES} current={currentStage} />

      <main className="main-content">
        {currentStage === 0 && (
          <ConfigureStage config={config} onSubmit={handleConfigSubmit} apiBase={API_BASE} />
        )}
        {currentStage === 1 && (
          <ScanStage scanId={scanId} apiBase={API_BASE} onComplete={handleScanComplete} />
        )}
        {currentStage === 2 && (
          <ReviewStage
            businesses={businesses}
            selectedLeads={selectedLeads}
            setSelectedLeads={setSelectedLeads}
            onNext={handleReviewNext}
            apiBase={API_BASE}
          />
        )}
        {currentStage === 3 && (
          <PreviewSendStage
            businesses={businesses}
            selectedLeads={selectedLeads}
            smtpConfig={smtpConfig}
            setSmtpConfig={setSmtpConfig}
            apiBase={API_BASE}
            onComplete={handleSendComplete}
          />
        )}
        {currentStage === 4 && (
          <DoneStage
            results={emailResults}
            totalLeads={selectedLeads.length}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Trustpilot Outreach Agent &mdash; Review Acceleration Platform</p>
      </footer>
    </div>
  );
}

export default App;
