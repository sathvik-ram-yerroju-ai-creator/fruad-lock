'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale } from '@/types/scam';
import { SUPPORTED_LANGUAGES, DEFAULT_LOCALE } from './locales';
import { TRANSLATIONS } from './translations/regional';
import { en } from './translations/en';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: typeof en;
  isRtl: boolean;
  languages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: en,
  isRtl: false,
  languages: SUPPORTED_LANGUAGES,
});

const STORAGE_KEY = 'fraudlock_preferred_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && TRANSLATIONS[saved]) {
        setLocaleState(saved);
      }
    } catch {
      // Ignore localStorage access failures in restricted environments
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
      const isRtlLang = newLocale === 'ur' || newLocale === 'ar';
      document.documentElement.dir = isRtlLang ? 'rtl' : 'ltr';
    } catch {
      // Ignore in non-browser context
    }
  };

  const currentTranslations = TRANSLATIONS[locale] || en;
  const isRtl = locale === 'ur' || locale === 'ar';

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: currentTranslations,
        isRtl,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
