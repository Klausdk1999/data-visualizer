"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { type Locale, setStoredLocale } from "@/lib/i18n";

interface LocaleSwitcherProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
};

export function LocaleSwitcher({ locale, onLocaleChange }: LocaleSwitcherProps) {
  const handleChange = () => {
    const nextLocale = locale === "en" ? "pt-BR" : "en";
    setStoredLocale(nextLocale);
    onLocaleChange(nextLocale);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleChange}
      className="text-xs font-semibold px-2"
      title={locale === "en" ? "Mudar para Português" : "Switch to English"}
    >
      {LOCALE_LABELS[locale]}
    </Button>
  );
}
