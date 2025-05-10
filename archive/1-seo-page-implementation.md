# SEO Page Implementation Guide

This guide explains how to implement SEO-optimized collection and individual pages with internationalization (i18n) support in a Next.js 14+ project. While we use a tool page as an example, this pattern can be applied to any page type (templates, blog posts, landing pages, etc.).

## Landing Page with i18n Overview

This guide also includes patterns to implement a fully internationalized landing page, covering middleware, translation loading, language switching, page structure, and reusable templates for rapid development.

## Database Schema

The SEO pages follow a consistent pattern where content is stored with language-specific columns. Here's an example using a `page` table:

```typescript
interface BasePage {
  id: bigint;              // Unique identifier
  created_at: timestamp;   // Creation timestamp
  keyword: text;           // Primary keyword
  slug: text;             // URL-friendly identifier
  last_edited_ts: timestamp; // Last edit timestamp
  volume: bigint;         // Search volume metric (optional)
  
  // Localized content (JSON)
  en: PageContent;        // English content (default)
  ja: PageContent;        // Japanese content
  'zh-Hant': PageContent; // Traditional Chinese content
  ko: PageContent;        // Korean content
  es: PageContent;        // Spanish content
  fr: PageContent;        // French content
  // ... other language columns as needed
}

// Example content structure (can vary by page type)
interface PageContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    description: string;
  };
  // ... other content sections specific to page type
}

// Example: Different page types extending the base
interface ToolPage extends BasePage {
  tool_type: string;
  pricing_type: string;
}

interface TemplatePage extends BasePage {
  category: string;
  difficulty_level: string;
}

interface BlogPage extends BasePage {
  author_id: string;
  published_date: timestamp;
}
```

## Implementation Structure

The page structure follows Next.js App Router conventions:

```
app/
├── landing/               # Default landing page
│   └── page.tsx
├── [locale]/             # Localized routes
│   └── landing/
│       └── page.tsx      # Localized landing page
├── page/                  # Collection pages
│   ├── page.tsx          # Main collection page
│   └── [slug]/           # Individual pages
│       └── page.tsx      # Individual page component
├── [locale]/             # Localized routes
│   └── page/
│       ├── page.tsx      # Localized collection page
│       └── [slug]/
│           └── page.tsx  # Localized individual page
```

## Middleware Setup

Copy the middleware implementation into your project root:

```bash
cp dev-playbook/common-component/middleware.ts middleware.ts
```

## Translation Loader

Import translation utilities from the shared module:

```ts
import { getTranslations, defaultLocale, locales } from '@/common-component/i18n'
```

## Language Switcher

Use the reusable component:

```tsx
import { LanguageSwitcher } from '@/common-component/language-switcher'
```

## Reusable Templates

We provide a standalone template for direct reuse in `4-landing-page-template.md`. It includes:
- Landing page component (`page.tsx`) with metadata generation.
- Sample JSON translation entries.
- Language switcher integration.

## Data Retrieval Methods

You can use various methods to retrieve page data. Here are some common approaches:

### 1. Using Supabase

```typescript
import { createClient } from "@/utils/supabase/server";

async function getPageContent(slug: string) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('page')
    .select('en')
    .eq('slug', slug)
    .maybeSingle();

  return data?.en;
}
```

### 2. Using Drizzle ORM

```typescript
import { db } from "@/db";
import { page } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getPageContent(slug: string) {
  const result = await db
    .select({ content: page.en })
    .from(page)
    .where(eq(page.slug, slug))
    .get();

  return result?.content;
}
```

### 3. Using Direct Database Queries (e.g., Postgres with node-postgres)

```typescript
import { pool } from "@/db/pool";

async function getPageContent(slug: string) {
  const { rows } = await pool.query(
    'SELECT en FROM page WHERE slug = $1',
    [slug]
  );
  
  return rows[0]?.en;
}
```

## Collection Page Implementation

```typescript
interface PageProps {
  searchParams: { page?: string };
}

export default async function CollectionPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? '1');
  const { pages, count } = await getPages(page);
  
  return (
    <main>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <MagicCard
            key={page.id}
            href={`/page/${page.slug}`}
            title={page.en.meta.title}
            description={page.en.meta.description}
          />
        ))}
      </div>
      {/* Pagination component */}
    </main>
  );
}
```

## Individual Page Implementation ([slug]/page.tsx)

```typescript
interface PageProps {
  params: {
    slug: string;
    locale?: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Get content in requested language, fallback to English
  const locale = params.locale ?? 'en';
  const data = await getPageContent(params.slug, locale);
  
  if (!data) notFound();
  
  return (
    <main>
      <Hero content={data.hero} />
      <ContentSection content={data.content} />
      {/* Other sections based on page type */}
    </main>
  );
}

// Metadata generation
export async function generateMetadata({ 
  params: { slug, locale = 'en' } 
}: PageProps): Promise<Metadata> {
  const data = await getPageContent(slug, locale);
  if (!data) return {};
  
  return {
    title: data.meta.title,
    description: data.meta.description,
    // ... other metadata
  };
}
```

## Key Implementation Points

1. **Default Language Content**
   - Always store the primary content in the `en` column
   - This serves as the fallback when translations are missing
   - All other language columns follow the same structure

2. **Page Structure**
   - Use `page/[slug]` pattern for consistent routing
   - Enables easy internationalization with `[locale]/page/[slug]`
   - Maintains clean URLs and good SEO

3. **Data Retrieval**
   - Choose the data access method based on your project needs
   - Ensure consistent error handling and type safety
   - Implement caching where appropriate

4. **Type Safety**
   - Define clear interfaces for each page type
   - Extend the base page interface for specific needs
   - Use TypeScript for better maintainability

## Best Practices

1. **Content Management**
   - Store structured content as JSON in language columns
   - Use consistent content structure across languages
   - Implement validation for content structure

2. **Performance**
   - Use server components for initial data fetching
   - Implement appropriate caching strategies
   - Handle loading and error states

3. **SEO**
   - Generate proper metadata for each page
   - Implement canonical URLs
   - Add structured data where appropriate

4. **Internationalization**
   - Handle missing translations gracefully
   - Consider RTL languages in layout
   - Implement proper language fallbacks

## Testing

```typescript
describe('SEO Pages', () => {
  it('should fetch content in requested language', async () => {
    const data = await getPageContent('example-page', 'ja');
    expect(data?.meta.title).toBeDefined();
  });
  
  it('should fallback to English when translation missing', async () => {
    const data = await getPageContent('example-page', 'unavailable-locale');
    expect(data).toEqual(englishContent);
  });
});
```

## Templates for Direct Reuse

For a ready-to-use landing page setup, refer to `4-landing-page-template.md` in this folder. Copy and adapt it to your project. 