import React, { useState, useEffect, useRef } from 'react';

function ScanStage({ scanId, apiBase, onComplete }) {
  const [status, setStatus] = useState('connecting');
  const [logs, setLogs] = useState([]);
  const [found, setFound] = useState(0);
  const [message, setMessage] = useState('Initializing scan...');
  const logRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!scanId) return;

    const es = new EventSource(`${apiBase}/api/scan/${scanId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.stage === 'complete') {
          setStatus('complete');
          setMessage(`Scan complete! Found ${data.businesses?.length || 0} businesses.`);
          es.close();
          setTimeout(() => onComplete(data.businesses || []), 1500);
        } else if (data.stage === 'error') {
          setStatus('error');
          setMessage(data.message || 'Scan failed');
          es.close();
        } else {
          setStatus('scanning');
          setMessage(data.message || 'Scanning...');
          if (data.found) setFound(data.found);
          setLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            message: data.message,
            type: data.found ? 'found' : 'info',
          }]);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      // Try polling instead if SSE fails
      es.close();
      pollForResults();
    };

    return () => {
      es.close();
    };
  }, [scanId, apiBase]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const pollForResults = async () => {
    setStatus('scanning');
    setMessage('Scanning (polling for results)...');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/scan/${scanId}`);
        const data = await res.json();
        if (data.status === 'complete') {
          clearInterval(interval);
          setStatus('complete');
          setMessage(`Scan complete! Found ${data.businessCount} businesses.`);
          setTimeout(() => onComplete(data.businesses || []), 1500);
        } else if (data.status === 'error') {
          clearInterval(interval);
          setStatus('error');
          setMessage(data.error || 'Scan failed');
        } else if (data.lastProgress) {
          setMessage(data.lastProgress.message || 'Scanning...');
          if (data.lastProgress.found) setFound(data.lastProgress.found);
        }
      } catch (e) {
        // Keep polling
      }
    }, 2000);
  };

  return (
    <div className="card">
      <div className="scan-container">
        {status !== 'complete' && status !== 'error' && (
          <div className="scan-animation" />
        )}

        {status === 'complete' && (
          <div className="done-icon" style={{ width: 80, height: 80, fontSize: 36, marginBottom: 20 }}>
            &#10003;
          </div>
        )}

        {status === 'error' && (
          <div className="done-icon" style={{ width: 80, height: 80, fontSize: 36, marginBottom: 20, background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}>
            &#10007;
          </div>
        )}

        <div className="scan-status">{message}</div>
        {found > 0 && status !== 'complete' && (
          <div className="scan-detail">{found} businesses discovered</div>
        )}

        {logs.length > 0 && (
          <div className="scan-log" ref={logRef}>
            {logs.map((log, i) => (
              <div key={i} className={`scan-log-entry ${log.type}`}>
                <span style={{ color: '#4a5568' }}>[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanStage;
