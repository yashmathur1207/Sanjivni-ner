import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';

export default function TranslatedText({ children }) {
  const { translateText, activeLanguage } = useTranslation();
  const [displayText, setDisplayText] = useState(children);

  useEffect(() => {
    let isMounted = true; // Prevents memory leaks

    const fetchTranslation = async () => {
      // Only translate if the child is a simple text string
      if (typeof children === 'string') {
        const result = await translateText(children);
        if (isMounted) setDisplayText(result);
      }
    };

    fetchTranslation();

    return () => { isMounted = false; };
  }, [children, activeLanguage, translateText]);

  return <>{displayText}</>;
}