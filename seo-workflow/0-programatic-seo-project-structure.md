# 0 - Programmatic SEO Project Structure

This file provides an overview of the entire codebase related to internationalized static pages, programmatic SEO page generation, and reusable workflow utilities.

```text
project-root/
├── app/
│   ├── [locale]/landing/page.tsx             # I18n static landing page
│   ├── landing/page.tsx                      # Default static landing page
│   ├── services/[slug]/page.tsx              # Default programmatic SEO page
│   └── [locale]/services/[slug]/page.tsx     # Localized programmatic page
├── components/
│   ├── language-switcher.tsx                 # Locale dropdown UI
│   ├── hreflang-tags.tsx                     # SEO alternate link injector
│   ├── SEOHead.tsx                           # Meta head helper
│   └── LocalizedLink.tsx                     # Next.js link with locale basename
├── lib/
│   ├── i18n.ts                               # Translation loader + locales list
│   ├── workflow-utils.ts                     # `toSlug`, `llm`, `googleSearch`, `concatenateFields`
│   ├── page-service.ts                       # DB fetchers (`getPageContent`, `getPageMetadata`)
│   └── pathUtils.ts                          # Route/path helpers
├── db/
│   ├── index.ts                              # Drizzle client setup
│   └── schema.ts                             # Table definitions (e.g. `service_page`, `blog_post`)
├── public/
│   └── locales/
│       ├── en.json
│       ├── ja.json
│       └── ...                               # Other locale JSON files
├── scripts/
│   └── run-workflow.ts                       # CLI runner for programmatic page generation
├── utils/seo-workflow/
│   ├── configurations/
│   │   └── service-page-seo-workflow.ts      # Core workflow definition example
│   └── prompts/
│       ├── service-page-content-prompt.ts
│       └── service-form-prompt.ts
└── package.json                              # Includes `generate-page` script
```

This structure covers the core files for programmatic SEO page generation:
- **Dynamic pages** under `app/services/[slug]/page.tsx` and `app/[locale]/services/[slug]/page.tsx`.
- **UI components** (SEOHead, LocalizedLink, language-switcher, hreflang-tags) in `components/`.
- **Helpers** (`i18n.ts`, `workflow-utils.ts`, `page-service.ts`, `pathUtils.ts`) in `lib/`.
- **Drizzle ORM** setup (`index.ts`, `schema.ts`) in `db/`.
- **Workflow definitions** and **prompts** in `utils/seo-workflow/`.
- **CLI runner** script `scripts/run-workflow.ts` for generating pages.

Follow this layout to integrate or extend your programmatic SEO pipelines. 