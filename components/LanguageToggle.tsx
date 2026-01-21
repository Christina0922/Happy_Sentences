'use client';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { Language } from '@/src/i18n/translations';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleToggle = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleToggle('kr')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                   ${
                     language === 'kr'
                       ? 'bg-white text-gray-900 shadow-sm'
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
      >
        KR
      </button>
      <button
        onClick={() => handleToggle('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                   ${
                     language === 'en'
                       ? 'bg-white text-gray-900 shadow-sm'
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
      >
        EN
      </button>
    </div>
  );
}

