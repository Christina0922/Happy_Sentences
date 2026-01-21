'use client';

import { LanguageProvider } from '@/src/contexts/LanguageContext';
import { EntitlementProvider } from '@/src/contexts/EntitlementContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <EntitlementProvider>
        {children}
      </EntitlementProvider>
    </LanguageProvider>
  );
}

