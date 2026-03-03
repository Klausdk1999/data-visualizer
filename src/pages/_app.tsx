import "@/styles/globals.css";
import Head from "next/head";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { useState, useEffect } from "react";
import { getStoredLocale, type Locale } from "@/lib/i18n";
import enMessages from "@/messages/en.json";
import ptBRMessages from "@/messages/pt-BR.json";

const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  "pt-BR": ptBRMessages,
};

export default function App({ Component, pageProps }: AppProps) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        <Head>
          <title>IoT Data Storage Dashboard</title>
          <meta
            name="description"
            content="IoT Data Storage Dashboard - Manage devices, signals, and data"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} locale={locale} onLocaleChange={setLocale} />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
