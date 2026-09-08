import React, { Suspense, useEffect, useState } from 'react';
import { X, Loader } from 'lucide-react';

export default function GameWrapper({ gameConfig, onExit, activeLanguage = "en" }) {
  const [startTime, setStartTime] = useState(null);

  // Start session timer on mount
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  // The Network Bridge: POST request to Flask
  const submitTelemetry = async (finalScore, timeSpentInSeconds) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: gameConfig?.id || 'unknown-game',
          score: finalScore,
          timeSpent: timeSpentInSeconds
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Success! Database receipt:", data);
      } else {
        console.warn("⚠️ Server responded, but there was an error.");
      }
    } catch (error) {
      console.error("🚨 Network error. (Payload will queue in IndexedDB):", error);
    } finally {
      onExit(); 
    }
  };

  // Standardized callback when a teammate's game module finishes
  const handleGameComplete = (score = 100, metrics = {}) => {
    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    console.log(`Game complete! Score: ${score}, Time: ${timeSpent}s`, metrics);
    submitTelemetry(score, timeSpent);
  };

  if (!gameConfig) return null;
  const GameComponent = gameConfig.component;

  return (
    <div className="game-wrapper-overlay" style={overlayStyle}>
      {/* Universal Top Bar */}
      <div className="game-top-bar" style={topBarStyle}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>{gameConfig.title}</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Test / Hackathon Demo Trigger */}
          <button 
            onClick={() => handleGameComplete(85)} 
            style={{ 
              background: '#10b981', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            Simulate Win (Score: 85)
          </button>

          {/* Exit Button */}
          <button onClick={onExit} style={closeBtnStyle} title="Exit Game">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Playable Game Canvas */}
      <div className="game-play-area" style={playAreaStyle}>
        <Suspense fallback={<div style={loadingStyle}><Loader className="spin" /> Loading Game...</div>}>
          <GameComponent 
            language={activeLanguage} 
            onComplete={handleGameComplete} 
          />
        </Suspense>
      </div>
    </div>
  );
}

// Inline Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fafc', zIndex: 1000, display: 'flex', flexDirection: 'column' };
const topBarStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', alignItems: 'center' };
const closeBtnStyle = { background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const playAreaStyle = { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const loadingStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#64748b' };