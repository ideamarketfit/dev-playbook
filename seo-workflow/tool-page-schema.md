# Tool Page Schema Documentation

This document outlines the database schema for the `tool_page` table using Drizzle ORM, which stores SEO-related content and translations for tool pages.

## Schema Overview

| Column Name | Type | Description |
|------------|------|-------------|
| id | bigint | Auto-incrementing unique identifier |
| createdAt | timestamp with timezone | Timestamp when the record was created |
| lastEditedAt | timestamp with timezone | Timestamp of the last edit |
| keyword | text | Primary keyword or search term for the tool |
| slug | text | URL-friendly identifier for the tool |
| volume | bigint | Search volume metric for the keyword |
| googleSearchResult | jsonb | Stored Google search results |

## Localization Fields

The schema includes fields for multiple language translations, all stored as JSONB:

- `en`: English content
- `ja`: Japanese content
- `zh`: Traditional Chinese content (stored as zh-Hant)
- `ko`: Korean content
- `es`: Spanish content
- `fr`: French content
- `pt`: Portuguese content
- `de`: German content
- `it`: Italian content
- `he`: Hebrew content
- `ar`: Arabic content

## Usage Examples with Drizzle ORM

### Schema Definition
```typescript
import { pgTable, varchar, bigint, timestamp, text, jsonb } from 'drizzle-orm/pg-core';

export const toolPage = pgTable('tool_page', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastEditedAt: timestamp('last_edited_ts', { withTimezone: true }).notNull().defaultNow(),
  keyword: text('keyword').notNull(),
  slug: text('slug'),
  volume: bigint('volume', { mode: 'number' }),
  googleSearchResult: jsonb('google_search_result'),
  en: jsonb('en'),
  ja: jsonb('ja'),
  zh: jsonb('zh-Hant'),
  ko: jsonb('ko'),
  es: jsonb('es'),
  fr: jsonb('fr'),
  pt: jsonb('pt'),
  de: jsonb('de'),
  it: jsonb('it'),
  he: jsonb('he'),
  ar: jsonb('ar'),
});
```

### Fetching All Data
```typescript
const toolPages = await db.select().from(toolPage);
```

### Fetching Specific Columns
```typescript
const toolPages = await db.select({
  keyword: toolPage.keyword,
  slug: toolPage.slug,
  en: toolPage.en
}).from(toolPage);
```

### Pagination Examples

#### Basic Pagination (10 items per page)
```typescript
// First page (items 0-9)
const toolPages = await db.select()
  .from(toolPage)
  .limit(10)
  .offset(0);

// Second page (items 10-19)
const toolPages = await db.select()
  .from(toolPage)
  .limit(10)
  .offset(10);
```

#### Pagination with Count
```typescript
// Get total count
const count = await db.select({ count: sql`count(*)` })
  .from(toolPage);

// Get paginated results
const toolPages = await db.select()
  .from(toolPage)
  .limit(10)
  .offset(0);
```

#### Advanced Pagination with Ordering
```typescript
const toolPages = await db.select()
  .from(toolPage)
  .limit(30)
  .offset(30) // For page 2 with 30 items per page
  .orderBy(desc(toolPage.createdAt));
```

## Notes

- All translation fields (`en`, `ja`, `zh`, etc.) use JSONB type for structured content storage
- Timestamps are stored in UTC timezone with timezone information
- The `volume` field can be used for SEO analytics and tracking
- The `googleSearchResult` field stores search results data in JSONB format
- The `id` field is auto-incrementing and managed by the database
- The `createdAt` and `lastEditedAt` fields are automatically managed with default values 