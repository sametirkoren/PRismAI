"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Language, translations } from "./index";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations[Language];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user settings to get the language preference
    async function fetchLanguage() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setLanguageState(data.language || "en");
        }
      } catch (error) {
        console.error("Error fetching language:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
