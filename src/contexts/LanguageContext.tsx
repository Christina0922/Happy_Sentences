'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '@/src/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('kr');
  const [mounted, setMounted] = useState(false);

  // 초기 언어 로드 (클라이언트 사이드에서만)
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem(STORAGE_KEY);
    if (savedLang === 'kr' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  // 언어 변경 및 저장
  const setLanguage = (lang: Language) => {
    if (lang !== 'kr' && lang !== 'en') {
      console.error('Invalid language:', lang);
      return;
    }
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  // 현재 언어의 번역 객체
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom Hook
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

