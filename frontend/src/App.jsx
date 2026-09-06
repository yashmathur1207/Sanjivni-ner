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
      {/* DEVELOPER TOGGLE - Remove before production */}
      <button 
        onClick={() => setUserRole(userRole === 'patient' ? 'caregiver' : 'patient')}
        style={{ position: 'absolute', top: 0, right: 0, zIndex: 9999, background: 'black', color: 'white', padding: '5px' }}
      >
        Switch to {userRole === 'patient' ? 'Caregiver' : 'Patient'}
      </button>

      {userRole === 'patient' ? (
        // --- PATIENT UI STARTS HERE ---
        <>
          <header className="top-nav">
            <div className="region-badge">
              <MapPin size={16} />
              <span>Assam</span>
            </div>
            <div className="nav-actions">
              <div className="streak-badge">
                <Flame size={16} color="#ff8b00" />
                <span>12 Day Streak</span>
              </div>
              <button className="icon-btn profile-btn"><User size={20} /></button>
            </div>
          </header>

          <main className="main-content">
            <h1 className="greeting">Good Morning, Aita.</h1>
            <p className="date-text">Today is Thursday, September 10th</p>

            <div className="category-scroll">
              {categories.map(cat => (
                <button 
                  key={cat.name} 
                  className={`category-pill ${activeCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <cat.icon size={18} />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <section className="reminders-section">
              <h2>Your Schedule</h2>
              <div className="reminder-list">
                {filteredReminders.map(rem => (
                  <div key={rem.id} className={`reminder-card ${rem.status}`}>
                    <div className="reminder-info">
                      <h3>{rem.title}</h3>
                      <p>{rem.time}</p>
                    </div>
                    <div className="checkbox"></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="memory-check-section">
              <div className="memory-card">
                <div className="memory-icon-bg">
                  <Brain size={28} color="#4f46e5" />
                </div>
                <div className="memory-content">
                  <h2>Today's Question</h2>
                  <p>Can you identify these family photos?</p>
                </div>
                <button className="play-btn">
                  <PlayCircle size={32} color="#4f46e5" />
                </button>
              </div>
            </section>

            <section className="mood-section">
              <h2>How are you feeling today?</h2>
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
        // --- PATIENT UI ENDS HERE ---
      ) : (
        // --- CAREGIVER UI STARTS HERE ---
        <CaregiverDashboard />
      )}
    </div>
  );
}

export default App;