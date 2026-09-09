import React, { useState } from 'react';
import { UserPlus, Activity, ShieldPlus } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [role, setRole] = useState('patient');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    weight: '',
    height: '',
    bloodGroup: 'A+',
    allergies: '',
    caregiverUid: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        alert(`Success! Your Generated UID is: ${data.user.uid}\nPlease save this for your records.`);
        onLoginSuccess(data.user); // Pass user data back to App.jsx to load dashboards
      }
    } catch (error) {
      console.error("Auth Error:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <ShieldPlus size={48} color="#4f46e5" style={{ marginBottom: '10px' }} />
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '28px' }}>Sanjivni-NER</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Cognitive Care Platform</p>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button 
            type="button"
            onClick={() => setRole('patient')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${role === 'patient' ? '#4f46e5' : '#e2e8f0'}`, background: role === 'patient' ? '#eef2ff' : 'transparent', fontWeight: 'bold', color: role === 'patient' ? '#4f46e5' : '#64748b', cursor: 'pointer' }}
          >
            I am a Patient
          </button>
          <button 
            type="button"
            onClick={() => setRole('caregiver')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${role === 'caregiver' ? '#10b981' : '#e2e8f0'}`, background: role === 'caregiver' ? '#ecfdf5' : 'transparent', fontWeight: 'bold', color: role === 'caregiver' ? '#10b981' : '#64748b', cursor: 'pointer' }}
          >
            I am a Caregiver
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input required name="name" placeholder="Full Name" onChange={handleChange} style={inputStyle} />
          
          {role === 'patient' && (
            <>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input name="weight" type="number" placeholder="Weight (kg)" onChange={handleChange} style={inputStyle} />
                <input name="height" type="number" placeholder="Height (cm)" onChange={handleChange} style={inputStyle} />
                <select name="bloodGroup" onChange={handleChange} style={inputStyle}>
                  <option value="A+">A+</option><option value="O+">O+</option><option value="B+">B+</option><option value="AB+">AB+</option>
                  <option value="A-">A-</option><option value="O-">O-</option><option value="B-">B-</option><option value="AB-">AB-</option>
                </select>
              </div>
              <input name="allergies" placeholder="Medical Allergies (if any)" onChange={handleChange} style={inputStyle} />
              <input required name="caregiverUid" placeholder="Link Caregiver UID (e.g. SANJ-CG-1234)" onChange={handleChange} style={inputStyle} />
            </>
          )}

          <button type="submit" style={{ background: '#4f46e5', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} /> Register & Generate UID
          </button>
        </form>

      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', boxSizing: 'border-box' };