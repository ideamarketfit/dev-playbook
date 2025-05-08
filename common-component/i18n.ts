import fs from 'fs/promises'
import path from 'path'

// Define the default and supported locales
export const defaultLocale = 'en'

export interface Language {
  code: string
  name: string
  flag: string
  dir?: 'ltr' | 'rtl'
}

// Reusable language metadata for UI components and middleware
export const languages: Language[] = [
  { code: 'en',       name: 'English',    flag: '🇺🇸', dir: 'ltr' },
  { code: 'zh-Hant',  name: '繁體中文',   flag: '🇹🇼', dir: 'ltr' },
  { code: 'ja',       name: '日本語',      flag: '🇯🇵', dir: 'ltr' },
  { code: 'ko',       name: '한국어',      flag: '🇰🇷', dir: 'ltr' },
  { code: 'es',       name: 'Español',     flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr',       name: 'Français',    flag: '🇫🇷', dir: 'ltr' },
  { code: 'pt',       name: 'Português',   flag: '🇵🇹', dir: 'ltr' },
  { code: 'de',       name: 'Deutsch',     flag: '🇩🇪', dir: 'ltr' },
  { code: 'it',       name: 'Italiano',    flag: '🇮🇹', dir: 'ltr' },
  { code: 'he',       name: 'עברית',       flag: '🇮🇱', dir: 'rtl' },
  { code: 'ar',       name: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
]

// Export the locale codes array for middleware or router config
export const locales = languages.map(lang => lang.code)

// Translation loader: reads JSON files from public/locales
export async function getTranslations<T = any>(
  locale: string = defaultLocale
): Promise<T> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'locales', `${locale}.json`)
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents) as T
  } catch (error) {
    if (locale !== defaultLocale) {
      return getTranslations(defaultLocale)
    }
    throw error
  }
} 