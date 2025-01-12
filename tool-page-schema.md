# Tool Page Schema Documentation

This document outlines the database schema for the `tool_page` table in Supabase, which stores SEO-related content and translations for tool pages.

## Schema Overview

| Column Name | Type | Description |
|------------|------|-------------|
| id | bigint | Unique identifier for each tool page |
| created_at | timestamp with timezone | Timestamp when the record was created |
| keyword | text | Primary keyword or search term for the tool |
| slug | text | URL-friendly identifier for the tool |
| last_edited_ts | timestamp with timezone | Timestamp of the last edit |
| volume | bigint | Search volume metric for the keyword |

## Localization Fields

The schema includes fields for multiple language translations:

### JSON Format Translations
- `en`: English content (JSON)
- `ja`: Japanese content (JSON)
- `zh-Hant`: Traditional Chinese content (JSON)

### Text Format Translations
- `ko`: Korean content
- `es`: Spanish content
- `fr`: French content
- `pt`: Portuguese content
- `de`: German content
- `it`: Italian content
- `he`: Hebrew content
- `ar`: Arabic content

## Usage Examples

### Fetching All Data
```typescript
const { data: tool_page, error } = await supabase
  .from('tool_page')
  .select('*')
```

### Fetching Specific Columns
```typescript
const { data: tool_page, error } = await supabase
  .from('tool_page')
  .select('keyword,slug,en')
```

### Pagination Examples

#### Basic Pagination (10 items per page)
```typescript
// First page (items 0-9)
const { data: tool_page, error } = await supabase
  .from('tool_page')
  .select('*')
  .range(0, 9)

// Second page (items 10-19)
const { data: tool_page, error } = await supabase
  .from('tool_page')
  .select('*')
  .range(10, 19)
```

#### Pagination with Count
```typescript
// Get total count along with paginated results
const { data: tool_page, count, error } = await supabase
  .from('tool_page')
  .select('*', { count: 'exact' })
  .range(0, 9)
```

#### Advanced Pagination with Page Size
```typescript
function getPaginationRange(page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  return { start, end }
}

// Example: Get page 2 with 30 items per page
const { start, end } = getPaginationRange(2, 30)
const { data: tool_page, error } = await supabase
  .from('tool_page')
  .select('*')
  .range(start, end)
  .order('created_at', { ascending: false })
```

## Notes

- JSON fields (`en`, `ja`, `zh-Hant`) can store structured content with multiple fields
- Text fields store direct translations without additional structure
- Timestamps are stored in UTC timezone
- The `volume` field can be used for SEO analytics and tracking 