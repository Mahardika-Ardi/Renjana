'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { pick, type CopyValue, type Lang } from './pick';

export type { Lang };

const LANG_STORAGE_KEY = 'renjana-lang';
/** Pre-migration key from when only the landing page was bilingual. */
const LEGACY_LANG_STORAGE_KEY = 'renjana-landing-lang';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'id',
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  // Default 'id' on first render so server HTML and first client paint match.
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    let ignore = false;
    // Deferred past the commit so the stored language never leaks into the
    // first client paint (hydration mismatch). Runs once, imperceptible.
    void Promise.resolve().then(() => {
      if (ignore) return;
      try {
        const saved =
          window.localStorage.getItem(LANG_STORAGE_KEY) ??
          window.localStorage.getItem(LEGACY_LANG_STORAGE_KEY);
        if (saved === 'id' || saved === 'en') setLangState(saved);
      } catch {
        // storage unavailable — stay on default
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Reflect the choice on <html lang> for a11y and browser translation.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

/** Resolve a bilingual copy tree for the active language. */
export function useCopy<T extends object>(copy: T): CopyValue<T> {
  const { lang } = useLang();
  return pick(copy, lang);
}
