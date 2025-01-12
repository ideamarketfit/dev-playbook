# SEO Page Implementation Guide

This guide explains how to implement SEO-optimized collection and individual pages with internationalization (i18n) support in a Next.js 14+ project.

## Database Schema (Supabase)

The SEO pages are stored in a `tool_page` table with the following key fields:

```typescript
interface ToolPage {
  id: bigint;              // Unique identifier
  created_at: timestamp;   // Creation timestamp
  keyword: text;           // Primary keyword
  slug: text;             // URL-friendly identifier
  last_edited_ts: timestamp; // Last edit timestamp
  volume: bigint;         // Search volume metric
  
  // Localized content (JSON)
  en: ToolPageContent;    // English content
  ja: ToolPageContent;    // Japanese content
  'zh-Hant': ToolPageContent; // Traditional Chinese content
  
  // Text translations
  ko: text;              // Korean
  es: text;              // Spanish
  fr: text;              // French
  // ... other language fields
}

interface ToolPageContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    description: string;
  };
  // ... other content sections
}
```

## Implementation Structure

```
app/
├── tools/
│   └── page.tsx           # Collection page
├── tool/
│   └── [slug]/
│       └── page.tsx      # Individual page
├── [locale]/
│   ├── tools/
│   │   └── page.tsx      # Localized collection page
│   └── tool/
│       └── [slug]/
│           └── page.tsx  # Localized page
```

## 1. Collection Page Implementation

### Default Route (app/tools/page.tsx)
```typescript
import { createClient } from "@/utils/supabase/server";
import { MagicCard } from "@/components/magicui/magic-card";

interface ToolPage {
  id: string;
  slug: string;
  keyword: string;
  volume: number;
  en: {
    meta: {
      title: string;
      description: string;
    };
  };
}

async function getTools(page: number = 1, perPage: number = 30) {
  const supabase = createClient(cookies());
  const start = (page - 1) * perPage;
  
  const { data, error, count } = await supabase
    .from('tool_page')
    .select('id, slug, keyword, volume, en', { count: 'exact' })
    .range(start, start + perPage - 1)
    .order('volume', { ascending: false });
    
  return { tools: data as ToolPage[], count };
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page ?? '1');
  const { tools, count } = await getTools(page);
  
  return (
    <main>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <MagicCard
            key={tool.id}
            href={`/tool/${tool.slug}`}
            title={tool.en.meta.title}
            description={tool.en.meta.description}
          />
        ))}
      </div>
      {/* Pagination component */}
    </main>
  );
}
```

## 2. Individual Page Implementation

### Default Route (app/tool/[slug]/page.tsx)
```typescript
import { createClient } from '@/utils/supabase/server';
import type { ToolPageContent } from '@/lib/types/tool-page';

interface ToolPageProps {
  params: {
    slug: string;
  };
}

async function getToolPageContent(slug: string) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('tool_page')
    .select('en')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  
  return {
    content: data.en as ToolPageContent
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const data = await getToolPageContent(params.slug);
  if (!data) notFound();
  
  return (
    <main>
      <Hero content={data.content.hero} />
      <FeatureSection content={data.content.features} />
      {/* Other sections */}
    </main>
  );
}
```

## 3. Internationalization Implementation

### Localized Routes

1. **Collection Page ([locale]/tools/page.tsx)**
```typescript
import { createClient } from "@/utils/supabase/server";

export default async function LocalizedToolsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { tools } = await getTools(locale);
  
  return (
    <main>
      {tools.map((tool) => (
        <MagicCard
          key={tool.id}
          href={`/${locale}/tool/${tool.slug}`}
          title={tool[locale].meta.title}
          description={tool[locale].meta.description}
        />
      ))}
    </main>
  );
}
```

2. **Individual Page ([locale]/tool/[slug]/page.tsx)**
```typescript
async function getLocalizedToolContent(slug: string, locale: string) {
  const supabase = createClient(cookies());
  
  const { data } = await supabase
    .from('tool_page')
    .select(`${locale}`)
    .eq('slug', slug)
    .maybeSingle();

  return data ? { content: data[locale] } : null;
}

export default async function LocalizedToolPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const data = await getLocalizedToolContent(slug, locale);
  if (!data) notFound();
  
  return (
    <main>
      <Hero content={data.content.hero} />
      {/* Other sections */}
    </main>
  );
}
```

## 4. SEO and Metadata

```typescript
// Generate metadata for pages
export async function generateMetadata({ 
  params: { locale, slug } 
}: ToolPageProps): Promise<Metadata> {
  const data = await getLocalizedToolContent(slug, locale);
  if (!data) return {};
  
  return {
    title: data.content.meta.title,
    description: data.content.meta.description,
    openGraph: {
      title: data.content.meta.title,
      description: data.content.meta.description,
    },
  };
}
```

## 5. Best Practices

1. **Data Fetching**
   - Use server components for initial data fetching
   - Implement caching strategies for frequently accessed content
   - Handle loading and error states appropriately

2. **Localization**
   - Store translations in Supabase as JSON for structured content
   - Use TypeScript interfaces for type safety
   - Implement fallback languages when translations are missing

3. **Performance**
   - Implement pagination for the collection page
   - Use server-side rendering for SEO
   - Optimize images and lazy load non-critical content

4. **SEO**
   - Generate proper metadata for each page
   - Implement proper canonical URLs
   - Add structured data where appropriate

## 6. Common Gotchas

1. Always validate locale parameter against supported languages
2. Handle missing translations gracefully with fallbacks
3. Consider RTL languages in your layout
4. Cache expensive database queries
5. Handle URL slugs consistently across languages

## 7. Testing

```typescript
describe('SEO Pages', () => {
  it('should fetch correct localized content', async () => {
    const data = await getLocalizedToolContent('example-page', 'ja');
    expect(data?.content.meta.title).toBeDefined();
  });
  
  it('should handle invalid slugs', async () => {
    const data = await getLocalizedToolContent('invalid-slug', 'en');
    expect(data).toBeNull();
  });
});
``` 