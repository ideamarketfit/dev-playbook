'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Languages } from 'lucide-react'

const languages = [
  { code: 'en',       name: 'English',    flag: '🇺🇸' },
  { code: 'zh-Hant',  name: '繁體中文',   flag: '🇹🇼' },
  { code: 'ja',       name: '日本語',      flag: '🇯🇵' },
  { code: 'ko',       name: '한국어',      flag: '🇰🇷' },
  { code: 'es',       name: 'Español',     flag: '🇪🇸' },
  { code: 'fr',       name: 'Français',    flag: '🇫🇷' },
  { code: 'pt',       name: 'Português',   flag: '🇵🇹' },
  { code: 'de',       name: 'Deutsch',     flag: '🇩🇪' },
  { code: 'it',       name: 'Italiano',    flag: '🇮🇹' },
  { code: 'he',       name: 'עברית',       flag: '🇮🇱' },
  { code: 'ar',       name: 'العربية',     flag: '🇸🇦' },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'

  const handleLanguageChange = (locale: string) => {
    const segments = pathname.split('/')
    const isLocalized = languages.some(lang => lang.code === segments[1])
    if (isLocalized) {
      segments[1] = locale
    } else {
      segments.splice(1, 0, locale)
    }
    const newPathname = segments.join('/')
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
    router.push(newPathname)
  }

  return (
    <Select defaultValue={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[160px] gap-2">
        <Languages className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map(lang => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 