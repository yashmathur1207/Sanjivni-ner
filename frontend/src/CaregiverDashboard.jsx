import TranslatedText from './components/TranslatedText';
import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, ShieldAlert, BrainCircuit, HeartPulse, Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES } from './context/TranslationContext';

function CaregiverDashboard() {
  const { activeLanguage, setActiveLanguage } = useTranslation();

  return (
    <div className="caregiver-container">
      {/* 1. Header & Patient Info */}
      {/* 1. Header & Patient Info */}
      <header className="caregiver-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Top Row: Language Selector (Pushed to Right) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
            <Globe size={16} color="#475569" />
            <select 
              value={activeLanguage} 
              onChange={(e) => setActiveLanguage(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontWeight: 'bold', color: '#475569', outline: 'none', cursor: 'pointer' }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Row: Profile (Left) & Status (Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="patient-profile" style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'left' }}>
            <div className="avatar">A</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Aita (Grandmother)</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', maxWidth: '200px' }}>UID: SANJ-8842-NER | Stage: Mild Cognitive Impairment</p>
            </div>
          </div>
          
          <div className="health-status safe" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '600', fontSize: '14px' }}>
            <CheckCircle size={20} />
            <span>Stable</span>
          </div>
        </div>
      </header>

      <main className="caregiver-main">
        {/* 2. Urgent Alerts */}
        <section className="alerts-section">
          <div className="alert-card warning">
            <AlertTriangle size={24} color="#b45309" />
            <div className="alert-text">
              <h4>Missed Hydration</h4>
              <p>Aita hasn't logged water intake in 4 hours.</p>
            </div>
            <button className="ping-btn">Ping Echo</button>
          </div>
        </section>

        {/* 3. Daily Adherence Grid */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <Activity size={20} color="#4f46e5" />
              <span><TranslatedText>Medication</TranslatedText></span>
            </div>
            <h3>100%</h3>
            <p className="subtext"><TranslatedText>All morning pills taken</TranslatedText></p>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <BrainCircuit size={20} color="#10b981" />
              <span><TranslatedText>Cognitive Session</TranslatedText></span>
            </div>
            <h3><TranslatedText>Completed</TranslatedText></h3>
            <p className="subtext"><TranslatedText>Score: 85/100 (Gamosa Patterns)</TranslatedText></p>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <HeartPulse size={20} color="#ef4444" />
              <span>Mood Trend</span>
            </div>
            <h3>Positive</h3>
            <p className="subtext">Logged 'Happy' at 9:00 AM</p>
          </div>
        </section>

        {/* 4. Remote Operations */}
        <section className="operations-section">
          <h3>Remote Care Tools</h3>
          <div className="action-buttons">
            <button className="action-btn">
              <Clock size={20} />
              <span>Add Reminder</span>
            </button>
            <button className="action-btn">
              <ShieldAlert size={20} />
              <span>Emergency SOS</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CaregiverDashboard;