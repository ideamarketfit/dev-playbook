# 0 - Prerequisites & Assumptions for Programmatic SEO

This document outlines the necessary project structure, environment variables, dependencies, database schema, and routing conventions before you implement the programmatic SEO and i18n workflow.

## 1. Project Structure
- Next.js 14+ with the `app/` directory.
- `db/`
  - `db/index.ts` — exports a Drizzle client using `DATABASE_URL`
  - `db/schema.ts` — defines your page table (e.g. `service_page`) with JSONB locale columns
- `lib/`
  - `page-service.ts` — `getPageContent` / `getPageMetadata`
  - `i18n.ts` & `pathUtils.ts` — supported locales, translation loader, URL helpers
  - `workflow-utils.ts` — slugify, LLM + Google Search wrappers, JSON concatenation
- `components/`
  - `SEOHead.tsx`, `LocalizedLink.tsx`, `hreflang-tags.tsx`, `language-switcher.tsx`
- `scripts/`
  - `run-workflow.ts` — CLI entry for `npm run generate-page`
- `utils/seo-workflow/`
  - `configurations/` — your `*-seo-workflow.ts` files
  - `prompts/` — LLM prompt builders
- `public/locales/`
  - One `<locale>.json` per language

## 2. Environment Variables
- `DATABASE_URL`
- `NEXT_PUBLIC_DOMAIN` (for `<link rel="alternate">`)
- LLM keys/models:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `NEXT_PUBLIC_SEO_MODEL`
  - `NEXT_PUBLIC_TRANSLATION_MODEL`
- (Optional) Google Search:
  - `GOOGLE_SEARCH_KEY`
  - `GOOGLE_SEARCH_ID`

## 3. Dependencies
```bash
npm install next@14 react react-dom drizzle-orm postgres drizzle-kit \
  @anthropic-ai/sdk openai axios cheerio lucide-react \
  # plus your select/dropdown UI lib (e.g. Radix UI)
```

## 4. Database Schema Requirements
- Table (e.g. `service_page`) with:
  - `slug` (text, unique)
  - `keyword` (text)
  - JSONB columns per locale (`en`, `ja`, `zh-Hant`, …) holding `page_content`, `form_config`, etc.
  - `created_at`, `updated_at` timestamps
- After editing `db/schema.ts`:
```bash
npx drizzle-kit push
```

## 5. Routing & Page Scaffolding
- Default: `app/<entity>/[slug]/page.tsx`
- Localized: `app/[locale]/<entity>/[slug]/page.tsx`
- Each page should:
  1. Export `generateMetadata({ params })` via `getPageMetadata(params.slug, params.locale)`
  2. In the main component, call `getPageContent`, handle `null` with `notFound()`, then render `<SEOHead>`, your content, and `<LocalizedLink>`.

## 6. Recommended i18n Languages
Based on your `common-component/i18n.ts` and the `[locale]` routing convention, the following locales are supported and recommended:
- en (English)
- zh-Hant (繁體中文)
- ja (日本語)
- ko (한국어)
- es (Español)
- fr (Français)
- pt (Português)
- de (Deutsch)
- it (Italiano)
- he (עברית)
- ar (العربية)
