import { defaultLocale, locales } from './i18n'

/**
 * Removes any leading locale segment from a path.
 */
export function stripLocale(path: string): string {
  for (const locale of locales) {
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      return path.replace(new RegExp(`^/${locale}`), '') || '/'
    }
  }
  return path
}

/**
 * Prefixes a path with the given locale, stripping any existing locale.
 */
export function withLocale(path: string, locale: string = defaultLocale): string {
  const clean = stripLocale(path)
  return `/${locale}${clean.startsWith('/') ? '' : '/'}${clean}`
} 