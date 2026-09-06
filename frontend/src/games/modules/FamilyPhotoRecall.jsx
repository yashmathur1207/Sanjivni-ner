import React from 'react';

export default function FamilyPhotoRecall({ language, onComplete }) {
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h3>📸 Family Photo Recall</h3>
      <p>Language: {language}</p>
      <button onClick={() => onComplete(100, {})} style={{ padding: '10px', background: '#10b981', color: 'white', borderRadius: '8px' }}>
        Simulate Win
      </button>
    </div>
  );
}