import React, { useState } from 'react';
import TranslatedText from './components/TranslatedText';
import { useTranslation, SUPPORTED_LANGUAGES } from './context/TranslationContext';
import { GAME_REGISTRY } from './games/registry';
import GameWrapper from './games/GameWrapper';
import CaregiverDashboard from './CaregiverDashboard';
import LoginPage from './LoginPage'; // <-- NEW IMPORT
import { 
  MapPin, User, Pill, Droplet, Utensils, 
  Calendar, ClipboardList, Mic, Brain, 
  Flame, PlayCircle 
} from 'lucide-react';
import './App.css';

// 1. Custom SVG Wave Generator
const WaveIcon = ({ level, color, size = 32 }) => {
  const paths = {
    1: "M2 12 L 5 2 L 8 22 L 12 2 L 15 22 L 19 2 L 22 12",
    2: "M2 12 L 7 6 L 12 18 L 17 6 L 22 12",               
    3: "M2 12 Q 7 10 12 12 T 22 12",                       
    4: "M2 12 Q 7 4 12 12 T 22 12",                        
    5: "M2 12 Q 4.5 4 7 12 T 12 12 T 17 12 T 22 12"        
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s ease' }}>
      <path d={paths[level]} />
    </svg>
  );
};

// 2. The Mood Selector UI
const MoodSelector = () => {
  const [selectedMood, setSelectedMood] = useState(null);

  const moods = [
    { level: 1, label: "Very Unpleasant", color: "#ef4444" },
    { level: 2, label: "Unpleasant", color: "#f97316" },     
    { level: 3, label: "Neutral", color: "#94a3b8" },        
    { level: 4, label: "Pleasant", color: "#84cc16" },       
    { level: 5, label: "Very Pleasant", color: "#10b981" }   
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.level);
    console.log(`Mood logged: ${mood.label} (Level ${mood.level})`);
  };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
      <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1e293b' }}>
        <TranslatedText>How are you feeling today?</TranslatedText>
      </h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        {moods.map((mood) => {
          const isSelected = selectedMood === mood.level;
          return (
            <button
              key={mood.level}
              onClick={() => handleMoodSelect(mood)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flex: 1, padding: '12px 4px', borderRadius: '10px', cursor: 'pointer',
                transition: 'all 0.2s ease', border: '2px solid',
                borderColor: isSelected ? mood.color : '#e2e8f0',
                backgroundColor: isSelected ? `${mood.color}15` : 'transparent',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
              title={mood.label}
            >
              <WaveIcon level={mood.level} color={isSelected ? mood.color : '#cbd5e1'} />
              <span style={{ fontSize: '11px', marginTop: '10px', fontWeight: isSelected ? '700' : '500', color: isSelected ? mood.color : '#64748b', textAlign: 'center', lineHeight: '1.2' }}>
                <TranslatedText>{mood.label}</TranslatedText>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 3. Main Application Component
function App() {
  // NEW: Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeCategory, setActiveCategory] = useState('All');
  const [userRole, setUserRole] = useState('patient'); 
  const [activeGameId, setActiveGameId] = useState(null);
  const { activeLanguage, setActiveLanguage, userRegion } = useTranslation();

  const categories = [
    { name: 'All', icon: ClipboardList },
    { name: 'Medicine', icon: Pill },
    { name: 'Hydration', icon: Droplet },
    { name: 'Meal', icon: Utensils },
    { name: 'Appointment', icon: Calendar },
  ];

  const reminders = [
    { id: 1, type: 'Medicine', title: 'Morning Blood Pressure Pill', time: '08:00 AM', status: 'pending' },
    { id: 2, type: 'Hydration', title: 'Drink 1 Glass of Water', time: '09:30 AM', status: 'pending' },
    { id: 3, type: 'Meal', title: 'Breakfast (Oats & Fruit)', time: '10:00 AM', status: 'completed' }
  ];

  const filteredReminders = activeCategory === 'All' 
    ? reminders 
    : reminders.filter(r => r.type === activeCategory);

  // 🔴 AUTHENTICATION INTERCEPTOR: Show Login Page if not logged in
  if (!isAuthenticated) {
    return (
      <LoginPage onLoginSuccess={(user) => {
        setCurrentUser(user);
        setUserRole(user.role); // Automatically sets 'patient' or 'caregiver' based on registration!
        setIsAuthenticated(true);
      }} />
    );
  }

  // Once authenticated, show the main app:
  return (
    <div className="app-container">
      {/* DEVELOPER TOGGLE (Keep for hackathon demo purposes) */}
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
            {/* Dynamic Greeting based on Registered Name! */}
            <h1 className="greeting">
              <TranslatedText>Good Morning</TranslatedText>, {currentUser?.name || 'Aita'}.
            </h1>
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

            <MoodSelector />

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
          </main>

          <button className="echo-assistant-fab">
            <Mic size={28} color="white" />
          </button>
        </>
      ) : (
        <CaregiverDashboard currentUser={currentUser} />
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