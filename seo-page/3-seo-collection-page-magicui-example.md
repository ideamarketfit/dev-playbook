# SEO Collection Page Implementation with Magic UI and i18n

> **Important Notice**: While this guide uses a tools collection page as an example, the implementation patterns and principles demonstrated here can be adapted for any page type in your application, including:
> - Template pages
> - Feature pages
> - Blog posts
> - Product pages
> - Category pages
> - Landing pages
> The core concepts of SEO optimization, i18n support, and performance considerations remain the same across different page types.

This guide demonstrates how to implement an SEO-friendly collection page using Magic UI components and internationalization (i18n) in a Next.js 14+ project. We'll use the tools page as an example.

## Table of Contents

1. [Required Packages & Project Structure](#required-packages--project-structure)
2. [Page Implementation](#page-implementation)
3. [Data Retrieval from Supabase](#data-retrieval-from-supabase)
4. [i18n Implementation](#i18n-implementation)
5. [Performance Optimization](#performance-optimization)

## Required Packages & Project Structure

### Core Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-icons": "^latest",
    "@supabase/supabase-js": "^latest",
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "tailwindcss": "^latest"
  }
}
```

### Project Structure
```
├── app/
│   ├── [locale]/
│   │   └── tools/
│   │       └── page.tsx      # Localized tools collection page
│   └── layout.tsx            # Root layout
├── components/
│   ├── landing/
│   │   ├── scroll-animated-header.tsx
│   │   └── footer.tsx
│   ├── magicui/
│   │   ├── magic-card.tsx
│   │   └── animated-shiny-text.tsx
│   └── ui/
│       ├── button.tsx
│       └── pagination.tsx
├── lib/
│   ├── i18n.ts              # i18n configuration
│   └── languages.ts         # Language settings
└── public/
    └── locales/             # Translation files
        ├── en.json
        └── es.json
```

## Page Implementation

### 1. Type Definitions

```typescript
interface ToolPage {
  id: string;
  slug: string;
  keyword: string;
  volume: number;
  created_at: string;
  localizedContent?: {
    hero: {
      title: string;
      description: string;
    };
    meta: {
      title: string;
      description: string;
    };
  };
}

interface Props {
  params: {
    locale: string;
  };
  searchParams: { 
    page?: string;
  };
}
```

### 2. Static Generation Configuration

```typescript
export async function generateStaticParams() {
  return getSupportedLanguageCodes().map(locale => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const { t } = await getTranslations(locale);
  
  return {
    title: t('tools.meta.title'),
    description: t('tools.meta.description'),
    openGraph: {
      title: t('tools.meta.title'),
      description: t('tools.meta.description'),
    },
  };
}
```

### 3. Component Structure

```typescript
export default async function ToolsPage({ params: { locale }, searchParams }: Props) {
  // Validate locale
  if (!isValidLanguage(locale)) {
    notFound();
  }

  // Get translations and data
  const { t } = await getTranslations(locale);
  const currentPage = Number(searchParams.page) || 1;
  const { tools, totalPages } = await getTools(currentPage, 30, locale);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header>
        {/* Hero Section */}
        <div className="text-center mt-16 mb-24">
          <h1>{t('tools.hero.title')}</h1>
          <p>{t('tools.hero.description')}</p>
          <CTAButton />
        </div>

        {/* Tools Grid */}
        <Suspense fallback={<LoadingSkeleton />}>
          <ToolsGrid tools={tools} locale={locale} />
        </Suspense>

        {/* Pagination */}
        <PaginationComponent 
          currentPage={currentPage} 
          totalPages={totalPages} 
          locale={locale}
        />
      </Header>
    </div>
  );
}
```

## Data Retrieval from Supabase

### 1. Database Schema
The tools collection is stored in a `tool_page` table with the following structure:
```sql
create table tool_page (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  keyword text not null,
  volume integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  en jsonb,
  es jsonb,
  -- Add more language columns as needed
);
```

### 2. Data Fetching Function

```typescript
async function getTools(page: number = 1, perPage: number = 30, locale: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const start = (page - 1) * perPage;
  const end = start + perPage - 1;

  const { data, count } = await supabase
    .from("tool_page")
    .select(`
      id,
      slug,
      keyword,
      volume,
      created_at,
      ${locale}
    `, { count: "exact" })
    .not('slug', 'is', null)
    .range(start, end)
    .order('volume', { ascending: false });

  // Transform data to include localized content
  const tools = (data || []).map(tool => ({
    id: tool.id,
    slug: tool.slug,
    keyword: tool.keyword,
    volume: tool.volume,
    created_at: tool.created_at,
    localizedContent: tool[locale] ? {
      hero: {
        title: tool[locale].hero?.title || tool.keyword,
        description: tool[locale].hero?.description || ''
      },
      meta: {
        title: tool[locale].meta?.title || tool.keyword,
        description: tool[locale].meta?.description || ''
      }
    } : undefined
  }));

  return {
    tools,
    totalPages: Math.ceil((count || 0) / perPage),
    currentPage: page,
  };
}
```

## i18n Implementation

### 1. Language Configuration (lib/languages.ts)

```typescript
const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function isValidLanguage(locale: string): locale is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(locale as SupportedLanguage);
}

export function getSupportedLanguageCodes() {
  return [...SUPPORTED_LANGUAGES];
}
```

### 2. Translation Structure (public/locales/en.json)

```json
{
  "tools": {
    "meta": {
      "title": "Online Tools Collection - Your Site",
      "description": "Discover our collection of online tools..."
    },
    "hero": {
      "title": "Online Tools",
      "description": "Find the perfect tool for your needs",
      "cta": {
        "text": "Get Started",
        "link": "/signup"
      }
    }
  },
  "common": {
    "tryNow": "Try Now",
    "loading": "Loading..."
  }
}
```

### 3. Translation Usage

```typescript
// In your page component
const { t } = await getTranslations(locale);

// Using translations
<h1>{t('tools.hero.title')}</h1>
<p>{t('tools.hero.description')}</p>
<Button>{t('common.tryNow')}</Button>
```

## Performance Optimization

1. **Server Components**
   - The page is a Server Component by default
   - Client-side interactivity is isolated to specific components

2. **Suspense Boundaries**
   ```typescript
   <Suspense
     fallback={
       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
         {Array.from({ length: 6 }).map((_, i) => (
           <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
         ))}
       </div>
     }
   >
     <ToolsGrid tools={tools} locale={locale} />
   </Suspense>
   ```

3. **Static Generation**
   - Pages are statically generated at build time for all supported languages
   - Dynamic data is fetched server-side with proper caching

4. **Image Optimization**
   - Use Next.js Image component for tool thumbnails
   - Implement proper loading strategies and image formats

5. **SEO Best Practices**
   - Proper metadata generation for each language
   - Semantic HTML structure
   - Proper heading hierarchy
   - Descriptive alt texts for images

This implementation provides a solid foundation for a performant, SEO-friendly collection page with proper internationalization support. The combination of Next.js 14+ features, Magic UI components, and Supabase integration creates a modern and maintainable codebase. 