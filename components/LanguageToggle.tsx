'use client';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { Language } from '@/src/i18n/translations';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleToggle = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-full p-1 border-2 border-pink-200 shadow-md">
      <button
        onClick={() => handleToggle('kr')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300
                   ${
                     language === 'kr'
                       ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
      >
        KR
      </button>
      <button
        onClick={() => handleToggle('en')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300
                   ${
                     language === 'en'
                       ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
      >
        EN
      </button>
    </div>
  );
}

