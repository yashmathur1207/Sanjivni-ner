import React from 'react';

export default function GamosaPattern({ language, onComplete }) {
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h3>🧶 Gamosa Pattern Match</h3>
      <button onClick={() => onComplete(100, {})} style={{ padding: '10px', background: '#10b981', color: 'white', borderRadius: '8px' }}>
        Simulate Win
      </button>
    </div>
  );
}