import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, ShieldAlert, BrainCircuit, HeartPulse } from 'lucide-react';

function CaregiverDashboard() {
  return (
    <div className="caregiver-container">
      {/* 1. Header & Patient Info */}
      <header className="caregiver-header">
        <div className="patient-profile">
          <div className="avatar">A</div>
          <div>
            <h2>Aita (Grandmother)</h2>
            <p>UID: SANJ-8842-NER | Stage: Mild Cognitive Impairment</p>
          </div>
        </div>
        <div className="health-status safe">
          <CheckCircle size={20} />
          <span>Stable</span>
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
              <span>Medication</span>
            </div>
            <h3>100%</h3>
            <p className="subtext">All morning pills taken</p>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <BrainCircuit size={20} color="#10b981" />
              <span>Cognitive Session</span>
            </div>
            <h3>Completed</h3>
            <p className="subtext">Score: 85/100 (Gamosa Patterns)</p>
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