import React, { createContext, useState, useContext, useEffect } from 'react';

const TranslationContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'as', label: 'Assamese (অসমীয়া)' },
  { code: 'mni', label: 'Manipuri (মৈতৈলোন্)' },
  { code: 'bn', label: 'Bengali (বাংলা)' }
];

export function TranslationProvider({ children }) {
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [userRegion, setUserRegion] = useState('Detecting Location...');

  // 🌍 AUTO-DETECT REGION ON LOAD
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Ping a free IP Geolocation API
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.region) {
          setUserRegion(data.region); // e.g., "Assam", "Manipur"
          
          // Map the detected state to our Bhashini languages
          if (data.region === 'Assam') setActiveLanguage('as');
          else if (data.region === 'Manipur') setActiveLanguage('mni');
          else if (data.region === 'Tripura' || data.region === 'West Bengal') setActiveLanguage('bn');
          // Defaults to 'en' if outside the localized zones
        } else {
          setUserRegion('Assam'); 
        }
      } catch (error) {
        console.error("Location detection failed, using fallback.", error);
        setUserRegion('Assam');
      }
    };

    detectLocation();
  }, []);

  const translateText = async (text) => {
    if (activeLanguage === 'en') return text;

    const BHASHINI_API_KEY = import.meta.env.VITE_BHASHINI_API_KEY || ""; 
    const BHASHINI_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";

    if (!BHASHINI_API_KEY) {
      if (activeLanguage === 'as') return `[অসমীয়া] ${text}`;
      if (activeLanguage === 'mni') return `[মৈতৈলোন্] ${text}`;
      if (activeLanguage === 'bn') return `[বাংলা] ${text}`;
      return text;
    }

    try {
      const response = await fetch(BHASHINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': BHASHINI_API_KEY },
        body: JSON.stringify({
          pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: "en", targetLanguage: activeLanguage } } }],
          inputData: { input: [{ source: text }] }
        })
      });
      const data = await response.json();
      return data.pipelineResponse[0].output[0].target;
    } catch (error) {
      console.error("Bhashini API Error:", error);
      return text; 
    }
  };

  // We now export `userRegion` alongside the translation tools
  return (
    <TranslationContext.Provider value={{ activeLanguage, setActiveLanguage, translateText, userRegion }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => useContext(TranslationContext);