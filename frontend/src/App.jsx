import TranslatedText from './components/TranslatedText';
import { useTranslation, SUPPORTED_LANGUAGES } from './context/TranslationContext';
import { GAME_REGISTRY } from './games/registry';
import GameWrapper from './games/GameWrapper';
import CaregiverDashboard from './CaregiverDashboard';
import React, { useState } from 'react';
import { 
  MapPin, User, Pill, Droplet, Utensils, 
  Calendar, ClipboardList, Mic, Brain, 
  Flame, Smile, Meh, Frown, PlayCircle 
} from 'lucide-react';
import './App.css';

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [mood, setMood] = useState(null);
  const [userRole, setUserRole] = useState('patient'); // 'patient' or 'caregiver'
  const [activeGameId, setActiveGameId] = useState(null);
  const { activeLanguage, setActiveLanguage, userRegion } = useTranslation();

  // Categories from your notebook sketch
  const categories = [
    { name: 'All', icon: ClipboardList },
    { name: 'Medicine', icon: Pill },
    { name: 'Hydration', icon: Droplet },
    { name: 'Meal', icon: Utensils },
    { name: 'Appointment', icon: Calendar },
  ];

  // Mock reminder data
  const reminders = [
    { id: 1, type: 'Medicine', title: 'Morning Blood Pressure Pill', time: '08:00 AM', status: 'pending' },
    { id: 2, type: 'Hydration', title: 'Drink 1 Glass of Water', time: '09:30 AM', status: 'pending' },
    { id: 3, type: 'Meal', title: 'Breakfast (Oats & Fruit)', time: '10:00 AM', status: 'completed' }
  ];

  const filteredReminders = activeCategory === 'All' 
    ? reminders 
    : reminders.filter(r => r.type === activeCategory);

return (
    <div className="app-container">
      {/* DEVELOPER TOGGLE */}
      <button 
        onClick={() => setUserRole(userRole === 'patient' ? 'caregiver' : 'patient')}
        style={{ position: 'absolute', top: 0, right: 0, zIndex: 9999, background: 'black', color: 'white', padding: '5px' }}
      >
        Switch to {userRole === 'patient' ? 'Caregiver' : 'Patient'}
      </button>

      {userRole === 'patient' ? (
        <>
          <header className="top-nav">
            <div className="region-badge">
              <MapPin size={16} />
              {/* Automatically shows detected state, plus manual override */}
              <span style={{ marginRight: '8px' }}><TranslatedText>{userRegion}</TranslatedText></span>
              <select 
                value={activeLanguage} 
                onChange={(e) => setActiveLanguage(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontWeight: 'bold', color: 'inherit', outline: 'none' }}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="nav-actions">
              <div className="streak-badge">
                <Flame size={16} color="#ff8b00" />
                <span><TranslatedText>12 Day Streak</TranslatedText></span>
              </div>
              <button className="icon-btn profile-btn"><User size={20} /></button>
            </div>
          </header>

          <main className="main-content">
            <h1 className="greeting"><TranslatedText>Good Morning, Aita.</TranslatedText></h1>
            <p className="date-text"><TranslatedText>Today is Thursday, September 10th</TranslatedText></p>

            <div className="category-scroll">
              {categories.map(cat => (
                <button 
                  key={cat.name} 
                  className={`category-pill ${activeCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <cat.icon size={18} />
                  <span><TranslatedText>{cat.name}</TranslatedText></span>
                </button>
              ))}
            </div>

            <section className="reminders-section">
              <h2><TranslatedText>Your Schedule</TranslatedText></h2>
              <div className="reminder-list">
                {filteredReminders.map(rem => (
                  <div key={rem.id} className={`reminder-card ${rem.status}`}>
                    <div className="reminder-info">
                      <h3><TranslatedText>{rem.title}</TranslatedText></h3>
                      <p><TranslatedText>{rem.time}</TranslatedText></p>
                    </div>
                    <div className="checkbox"></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="memory-check-section">
              <h2><TranslatedText>Cognitive & Memory Games</TranslatedText></h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {GAME_REGISTRY.map((game) => (
                  <div key={game.id} className="memory-card" style={{ display: 'flex', alignItems: 'center', background: '#eef2ff', padding: '16px', borderRadius: '16px', gap: '15px' }}>
                    <div className="memory-icon-bg" style={{ background: 'white', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                      <game.icon size={28} color="#4f46e5" />
                    </div>
                    <div className="memory-content" style={{ flex: 1 }}>
                      <h2 style={{ margin: 0, fontSize: '16px', color: '#312e81' }}><TranslatedText>{game.title}</TranslatedText></h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4338ca' }}><TranslatedText>{game.englishDescription}</TranslatedText></p>
                    </div>
                    <button className="play-btn" onClick={() => setActiveGameId(game.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <PlayCircle size={32} color="#4f46e5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="mood-section">
              <h2><TranslatedText>How are you feeling today?</TranslatedText></h2>
              <div className="mood-buttons">
                <button className={`mood-btn ${mood === 'happy' ? 'selected' : ''}`} onClick={() => setMood('happy')}>
                  <Smile size={36} color="#22c55e" />
                </button>
                <button className={`mood-btn ${mood === 'neutral' ? 'selected' : ''}`} onClick={() => setMood('neutral')}>
                  <Meh size={36} color="#f59e0b" />
                </button>
                <button className={`mood-btn ${mood === 'sad' ? 'selected' : ''}`} onClick={() => setMood('sad')}>
                  <Frown size={36} color="#ef4444" />
                </button>
              </div>
            </section>
          </main>

          <button className="echo-assistant-fab">
            <Mic size={28} color="white" />
          </button>
        </>
      ) : (
        <CaregiverDashboard />
      )}
      
      {activeGameId && (
        <GameWrapper 
          gameConfig={GAME_REGISTRY.find(g => g.id === activeGameId)} 
          onExit={() => setActiveGameId(null)} 
          activeLanguage={activeLanguage} 
        />
      )}
    </div>
  );
}

export default App;