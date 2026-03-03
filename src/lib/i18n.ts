const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return detectBrowserLocale();
}

export function setStoredLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const browserLang = navigator.language;
  if (browserLang.startsWith("pt")) return "pt-BR";
  return DEFAULT_LOCALE;
}

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { Locale };
