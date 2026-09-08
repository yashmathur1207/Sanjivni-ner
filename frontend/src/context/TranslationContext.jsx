import React, { createContext, useState, useContext } from 'react';

// Create the Context
const TranslationContext = createContext();

// Bhashini Language Codes for NER
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'as', label: 'Assamese (অসমীয়া)' },
  { code: 'mni', label: 'Manipuri (মৈতৈলোন্)' },
  { code: 'bn', label: 'Bengali (বাংলা)' } // Widely used in Tripura/parts of Assam
];

export function TranslationProvider({ children }) {
  const [activeLanguage, setActiveLanguage] = useState('en');

  // The Core Engine: Sends text to Bhashini API
  const translateText = async (text) => {
    // If it's English, no translation needed
    if (activeLanguage === 'en') return text;

    // TODO: Replace with your actual Bhashini API key and Pipeline ID
    const BHASHINI_API_KEY = import.meta.env.VITE_BHASHINI_API_KEY || ""; 
    const BHASHINI_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";

    if (!BHASHINI_API_KEY) {
      // 🚨 MOCK FALLBACK (so you can keep coding without the key)
      console.warn("No Bhashini Key found. Using mock translation.");
      if (activeLanguage === 'as') return `[অসমীয়া] ${text}`;
      if (activeLanguage === 'mni') return `[মৈতৈলোন্] ${text}`;
      return text;
    }

    try {
      // Standard Bhashini Dhruva API Payload
      const response = await fetch(BHASHINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BHASHINI_API_KEY
        },
        body: JSON.stringify({
          pipelineTasks: [
            {
              taskType: "translation",
              config: {
                language: {
                  sourceLanguage: "en",
                  targetLanguage: activeLanguage
                }
              }
            }
          ],
          inputData: {
            input: [{ source: text }]
          }
        })
      });

      const data = await response.json();
      return data.pipelineResponse[0].output[0].target;
    } catch (error) {
      console.error("Bhashini API Error:", error);
      return text; // Fallback to English if API crashes
    }
  };

  return (
    <TranslationContext.Provider value={{ activeLanguage, setActiveLanguage, translateText }}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook so your teammates can easily use this in their games
export const useTranslation = () => useContext(TranslationContext);