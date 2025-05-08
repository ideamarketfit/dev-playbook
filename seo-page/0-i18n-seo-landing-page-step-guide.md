# 0 - Internationalized SEO Landing Page Step-by-Step Guide

This guide walks you through creating a fully SEO-optimized, internationalized landing page in Next.js 14+ using our shared common-component library and landing-page template.

## Project Structure

```text
app/
├── [locale]/
│   └── landing/
│       └── page.tsx      # Localized landing page
├── layout.tsx            # Root layout
└── landing/
    └── page.tsx          # Default landing page

components/
├── landing/
│   ├── scroll-animated-header.tsx
│   └── hero-section.tsx
└── magicui/ (or shadecn)
    └── magic-card.tsx

common-component/
├── middleware.ts
├── i18n.ts
├── language-switcher.tsx
└── hreflang-tags.tsx

lib/
└── i18n.ts

public/
└── locales/
    ├── en.json
    └── ...
```

> **Note:** The `components/` directory and component names shown above are illustrative; replace them with your project's actual UI components and directory structure.

## 1. Copy Shared Components & Middleware

From `dev-playbook/common-component/`, copy into your project:

```bash
# Middleware for locale redirects
cp dev-playbook/common-component/middleware.ts middleware.ts

# Translation loader + locales list
cp dev-playbook/common-component/i18n.ts lib/i18n.ts

# Language selector UI
cp dev-playbook/common-component/language-switcher.tsx components/language-switcher.tsx

# Hreflang tags component
cp dev-playbook/common-component/hreflang-tags.tsx components/hreflang-tags.tsx
```

## 2. Install Required UI Dependencies

```bash
npm install lucide-react
# Also install radix/ui or your preferred select library used by LanguageSwitcher
```

## 3. Add Translation JSON Files

Under `public/locales/`, create one file per supported locale (e.g. `en.json`, `ja.json`):

```json
{
  "landing": {
    "meta": { "title": "Welcome", "description": "Start here." },
    "hero": { "heading": "Hello!", "subheading": "Enjoy our site." }
  }
}
```

Ensure the same structure across all locale files.

## 4. Configure Next.js Middleware

Your `middleware.ts` now handles:

- Reading `NEXT_LOCALE` cookie or `Accept-Language` header
- Redirecting to `/{locale}/…`
- Setting the `NEXT_LOCALE` cookie

No further edits required if you copied the template.

## 5. Inject Hreflang Tags

In `app/layout.tsx` or your root layout:

```tsx
import { HreflangTags } from '@/components/hreflang-tags'

export default function RootLayout({ children }) {
  return (
    <html>
      <head><HreflangTags /></head>
      <body>{children}</body>
    </html>
  )
}
```

This emits `<link rel="alternate"/>` tags for each locale plus `x-default`.

## 6. Add Language Switcher to Footer

Include the dropdown in your footer component:

```tsx
'use client'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Footer() {
  return (
    <footer className="flex justify-center p-4">
      <LanguageSwitcher />
    </footer>
  )
}
```

## 7. Scaffold Your Landing Page

Use the landing-page template in `dev-playbook/seo-page/4-landing-page-template.md`:

```bash
# Copy the template code into your app:
mkdir -p app/landing app/[locale]/landing
# Paste code blocks from the template into:
# - app/landing/page.tsx
# - app/[locale]/landing/page.tsx
```

Each page:
- Imports `getTranslations` from `lib/i18n.ts`
- Renders sections using `t.landing.*`
- Exports `generateMetadata` based on `t.landing.meta`

## 8. Use the Translation Loader

In your pages:

```ts
import { getTranslations, defaultLocale } from '@/lib/i18n'

// Default page
export default async function LandingPage() {
  const t = await getTranslations(defaultLocale)
  /* ... */
}

// Localized page
export default async function LocalizedLandingPage({ params: { locale } }) {
  const t = await getTranslations(locale)
  /* ... */
}
```

## 9. Build & Test

- Run `npm run dev` and visit `/landing` → should redirect to `/en/landing` or user's locale.
- Verify `<link rel="alternate"/>` tags in page source.
- Use LanguageSwitcher to navigate locales.
- Optionally write tests for `getTranslations('ja')` to confirm key availability.

---

Congratulations! Your landing page is now SEO-friendly and fully internationalized. Reuse the same setup for other pages (blog, product, etc.) by following these steps. 