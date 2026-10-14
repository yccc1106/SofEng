'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { translations } from './translations';
import { adminTranslations } from './admin-translations';

const adminEnglishToChinese = Object.fromEntries(
  Object.entries(adminTranslations).map(([chinese, english]) => [english, chinese]),
);

export type Language = 'zh-CN' | 'en-US';
const storageKey = 'meetu-language';
const languageChangeEvent = 'meetu-language-change';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(languageChangeEvent, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(languageChangeEvent, onChange);
  };
}

function getLanguage(): Language {
  return window.localStorage.getItem(storageKey) === 'en-US' ? 'en-US' : 'zh-CN';
}

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore<Language>(subscribe, getLanguage, () => 'zh-CN');

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next: Language) => {
    window.localStorage.setItem(storageKey, next);
    window.dispatchEvent(new Event(languageChangeEvent));
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t: (text) => language === 'zh-CN'
        ? translations[text] ?? adminEnglishToChinese[text] ?? text
        : adminTranslations[text] ?? text,
    }}>
      <ConfigProvider locale={language === 'zh-CN' ? zhCN : enUS}>{children}</ConfigProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is missing');
  return context;
}

export function Localized({ children }: { children: string }) {
  const { t } = useLanguage();
  return <>{t(children)}</>;
}
