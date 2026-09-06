import React, { Suspense, useEffect, useState } from 'react';
import { X, Loader } from 'lucide-react';

export default function GameWrapper({ gameConfig, onExit, activeLanguage = "en" }) {
  const [startTime, setStartTime] = useState(null);

  // Start the timer when the game loads
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  // Standardized callback when a teammate's game finishes
  const handleGameComplete = (score, metrics) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    console.log(`Game over! Score: ${score}, Time: ${timeSpent}s`);
    
    // In the future, this will send the telemetry to the Caregiver Dashboard
    onExit(); 
  };

  // The actual game component your teammate built
  const GameComponent = gameConfig.component;

  return (
    <div className="game-wrapper-overlay" style={overlayStyle}>
      {/* Universal Top Bar for every game */}
      <div className="game-top-bar" style={topBarStyle}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>{gameConfig.title}</h2>
        <button onClick={onExit} style={closeBtnStyle}>
          <X size={24} />
        </button>
      </div>

      {/* The Game Area (Suspense handles the loading state) */}
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

// Quick inline styles for the wrapper (keeps things modular)
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fafc', zIndex: 1000, display: 'flex', flexDirection: 'column' };
const topBarStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', alignItems: 'center' };
const closeBtnStyle = { background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const playAreaStyle = { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const loadingStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#64748b' };