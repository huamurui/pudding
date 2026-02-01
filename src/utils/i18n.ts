import { i18nConfig, type SupportedLocale, getLocale, t as tBase } from '@/config/i18n.config'
import { siteConfig } from '@/config/site.config'

export type { SupportedLocale }

export { getLocale }

export function t(path: string, params?: Record<string, string | number>, locale?: SupportedLocale): string {
  const currentLocale = locale || siteConfig.locale as SupportedLocale
  return tBase(currentLocale, path, params)
}

export function useI18n(locale?: SupportedLocale): { locale: SupportedLocale; t: (path: string, params?: Record<string, string | number>) => string; config: typeof i18nConfig[SupportedLocale] } {
  const currentLocale = locale || siteConfig.locale as SupportedLocale
  const config = i18nConfig[currentLocale]

  return {
    locale: currentLocale,
    t: (path: string, params?: Record<string, string | number>) => t(path, params, currentLocale),
    config
  }
}
