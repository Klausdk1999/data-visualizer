// Test stub for next-intl. Avoids loading the ESM build which Jest can't parse.
import React from "react";

export const useTranslations =
  (_namespace?: string) =>
  (key: string, _values?: Record<string, unknown>): string =>
    key;

export const useLocale = (): string => "en";
export const useFormatter = () => ({
  dateTime: (d: Date) => d.toISOString(),
  number: (n: number) => String(n),
  relativeTime: (d: Date) => d.toISOString(),
});
export const useNow = (): Date => new Date(0);
export const useTimeZone = (): string => "UTC";
export const useMessages = (): Record<string, unknown> => ({});

export const NextIntlClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => <>{children}</>;

export const IntlProvider = NextIntlClientProvider;
