'use client';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { Language } from '@/src/i18n/translations';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleToggle = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-gray-200">
      <button
        onClick={() => handleToggle('kr')}
        className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-colors duration-200
                   ${
                     language === 'kr'
                       ? 'bg-gray-800 text-white'
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
      >
        KR
      </button>
      <button
        onClick={() => handleToggle('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-colors duration-200
                   ${
                     language === 'en'
                       ? 'bg-gray-800 text-white'
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
      >
        EN
      </button>
    </div>
  );
}

