# 0 - Internationalized Programmatic SEO Pages Step-by-Step Guide

This guide shows you how to build dynamic SEO-optimized pages (e.g. services, blog posts) with internationalization in Next.js 14+ using Postgres + Drizzle and our shared common-component library.

> **Note:** In examples we use the `services` slug. You can replace it with any entity name—`tools`, `templates`, `blog`, `products`, etc.—by updating route directories and table names accordingly.

## 1. Copy Shared Components & Utilities

From `dev-playbook/common-component/`, copy into your project:

```bash
# Locale detection middleware
cp dev-playbook/common-component/middleware.ts middleware.ts

# i18n loader and locale list
cp dev-playbook/common-component/i18n.ts lib/i18n.ts

# Content fetching utilities
cp dev-playbook/common-component/page-service.ts lib/page-service.ts

# SEO head helper
cp dev-playbook/common-component/SEOHead.tsx components/SEOHead.tsx

# Link and path utilities
cp dev-playbook/common-component/LocalizedLink.tsx components/LocalizedLink.tsx
cp dev-playbook/common-component/pathUtils.ts lib/pathUtils.ts

# Language switcher UI
cp dev-playbook/common-component/language-switcher.tsx components/language-switcher.tsx

# Hreflang tag injector
cp dev-playbook/common-component/hreflang-tags.tsx components/hreflang-tags.tsx
```

> **Note:** Adjust paths (`lib/`, `components/`) to match your project structure.

## 2. Install Dependencies

Ensure you have:

- Drizzle ORM and postgres-js
- Lucide icons (for UI)
- Your select/dropdown library (for the language switcher)

Example:
```bash
npm install drizzle-orm postgres lucide-react
```

## 3. Configure Database Connection

In `db/index.ts`, set up your Postgres client and Drizzle schema (see `seo-workflow/1-setup-and-schema.md`). Use environment variables (`DATABASE_URL`) and export `db`.

> **Database Schema Assumption:** Your table (e.g. `service_page`) includes JSONB columns for each locale (`en`, `ja`, `zh-Hant`, etc.) containing `page_content` (and optional `form_config`), as defined in `db/schema.ts`.

> **Database Schema Requirements:** Ensure your table defines:
> - `slug` (text): unique and not null, used to route and fetch page content.
> - `keyword` (text): not null, used as the primary SEO keyword.
> - JSONB columns per locale (e.g. `en`, `ja`, etc.) holding your `page_content` payload. (make sure yuo create one for each language)
> - Other fields as needed (e.g. `form_config`, `featured`, `google_search_result`).

After modifying your schema (`db/schema.ts`), push the changes to your database:

```bash
npx drizzle-kit push
```

## 4. Add Translation Files

Under `public/locales/`, create one JSON file per locale, with the same keys for your dynamic pages (e.g. `services`, `blog`):

```json
{
  "service_form": { /* labels and messages */ },
  "platform_comparison": { /* section data */ },
  "footer": { /* footer links */ },
  /* ... */
}
```

> **Note:** The JSON keys in your translation files (e.g. `service_form`, `platform_comparison`, `footer`) are illustrative. Adapt the key names and structure to match the actual sections and content schema of your pages.

## 5. Wire Up Middleware

Copy `middleware.ts` to your project root. It will:

- Detect locale (cookie + Accept-Language)
- Redirect requests to `/{locale}/...`
- Set `NEXT_LOCALE` cookie

No further edits are required unless you need custom excluded paths.

## 6. Inject Hreflang Tags

In your root layout (`app/layout.tsx`):

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

This adds `<link rel="alternate"/>` tags for SEO.

## 7. Add Language Switcher

Place the dropdown in your footer (or header) component:

```tsx
'use client'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Footer({ content }) {
  return (
    <footer>
      {/* your footer links */}
      <LanguageSwitcher />
    </footer>
  )
}
```

## 8. Scaffold Dynamic Pages

Define routes for your entity, e.g. services:

```
app/
├── services/
│   └── [slug]/
│       └── page.tsx         # Default (no locale)
└── [locale]/
    └── services/
        └── [slug]/
            └── page.tsx     # Localized version
```

> **Route Params:** Each page receives `params: { locale: string; slug: string }`, where `locale` comes from the URL segment (`/en/...`) and `slug` is your unique identifier (e.g. `my-service`). Use these directly to fetch content and metadata.

Use the following patterns in each page:

### Page Component

- Import `getPageContent` and `getPageMetadata` from `lib/page-service.ts`
- Export `generateMetadata` that calls `getPageMetadata(slug, locale)`
- In the default export, call `getPageContent(slug, locale)`, handle `null` with `notFound()`, then render:
  - `<SEOHead {...meta} />`
  - Your page content components (e.g. `<HeroSection>`, `<ServiceForm>`, `<PlatformComparison>`) using the returned JSON
  - `<LocalizedLink>` for in-app navigation
  - Footer with localized content

> **Tip:** Wrap repeated layout around a `<PageLayout>` if desired.

## 9. Test Your Setup

- Start dev server (`npm run dev`) and visit `/services/your-slug` → you should get redirected to `/en/services/your-slug` or the user's locale.
- Inspect `<head>` for correct `<title>`, `<meta>` and `<link rel="alternate"/>` tags.
- Switch locales via the language switcher and verify content changes.
- Write tests for `getPageContent('example-slug', 'ja')` to ensure fallback behavior.

---

Following these steps, you can rapidly spin up any programmatic SEO page type with full internationalization and SEO best practices. Reuse the same shared utilities for blog posts, products, or any other dynamic routes. 