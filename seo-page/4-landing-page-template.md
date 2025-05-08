# Landing Page Template with i18n Support

This template provides a ready-to-use landing page implementation with internationalization support for Next.js 14+.

## File Structure

```
app/
├── landing/
│   └── page.tsx           # Default landing page (English)
├── [locale]/
│   └── landing/
│       └── page.tsx       # Localized landing page
public/
└── locales/
    ├── en.json            # English translations
    └── {locale}.json      # Other locale translations
```

## app/landing/page.tsx

```tsx
import { getTranslations } from '@/lib/i18n'

export default async function LandingPage() {
  const t = await getTranslations('en')
  return (
    <main>
      {/* Example hero section */}
      <HeroSection content={t.landing.hero} />
      {/* Add more sections here */}
    </main>
  )
}

export async function generateMetadata() {
  const { landing } = await getTranslations('en')
  return {
    title: landing.meta.title,
    description: landing.meta.description,
  }
}
```

## app/[locale]/landing/page.tsx

```tsx
import { getTranslations } from '@/lib/i18n'

export default async function LocalizedLandingPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations(locale)
  return (
    <main>
      {/* Example hero section */}
      <HeroSection content={t.landing.hero} />
      {/* Add more sections here */}
    </main>
  )
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const { landing } = await getTranslations(locale)
  return {
    title: landing.meta.title,
    description: landing.meta.description,
  }
}
```

## JSON Translation Example

```json
{
  "landing": {
    "meta": {
      "title": "Welcome to Our Site",
      "description": "Discover our features and services."
    },
    "hero": {
      "heading": "Welcome!",
      "subheading": "Your journey starts here."
    }
  }
}
```

## Language Switcher Usage

```tsx
'use client'
import { LanguageSwitcher } from '@/components/language-switcher'

export function LandingHeader() {
  return (
    <header>
      <LanguageSwitcher />
      {/* Add other header elements here */}
    </header>
  )
}
```

## How to Use

1. Copy the `landing` folder and its `[locale]/landing` counterpart into your `app/` directory.
2. Add the `landing` key to your `public/locales/{locale}.json` files.
3. Import and place the `LanguageSwitcher` component in your header or layout. 