import React from 'react';

function ProgressTracker({ stages, current }) {
  return (
    <div className="progress-tracker">
      {stages.map((stage, i) => (
        <React.Fragment key={stage}>
          <div className={`progress-step ${i === current ? 'active' : ''} ${i < current ? 'completed' : ''}`}>
            <span className="step-number">
              {i < current ? '\u2713' : i + 1}
            </span>
            <span className="step-label">{stage}</span>
          </div>
          {i < stages.length - 1 && (
            <div className={`progress-connector ${i < current ? 'completed' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default ProgressTracker;
