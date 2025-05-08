'use client'

import { usePathname } from 'next/navigation'

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'he', name: 'עברית' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'zh-Hant', name: '繁體中文' },
]

export function HreflangTags() {
  const pathname = usePathname()
  const domain = process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : ''

  // Remove existing locale prefix from pathname
  const path = pathname.replace(
    /^\/(?:en|fr|ar|de|es|he|it|ja|ko|pt|zh-Hant)/,
    ''
  )

  return (
    <>
      {SUPPORTED_LANGUAGES.map(({ code }) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={code}
          href={`${domain}${code === 'en' ? '' : `/${code}`}${path}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${domain}${path}`}
      />
    </>
  )
} 