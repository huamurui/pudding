import { i18nConfig, type SupportedLocale, getLocale, t as tBase } from '@/config/i18n.config';

export type { SupportedLocale };

export { getLocale };

export function t(path: string, params?: Record<string, string | number>, locale?: SupportedLocale): string {
  const currentLocale = locale || getLocale();
  return tBase(currentLocale, path, params);
}

export function useI18n(locale?: SupportedLocale) {
  const currentLocale = getLocale(locale);
  const config = i18nConfig[currentLocale];
  
  return {
    locale: currentLocale,
    t: (path: string, params?: Record<string, string | number>) => t(path, params, currentLocale),
    config
  };
}
