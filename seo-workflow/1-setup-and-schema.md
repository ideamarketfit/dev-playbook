# Step 1: Project Setup and Schema Configuration

## Why This Pattern?
- **Type Safety**: Using TypeScript and Drizzle ORM ensures type safety across the application
- **Database Flexibility**: JSONB columns allow storing flexible content structures without migrations
- **Maintainability**: Centralized schema and type definitions make updates easier
- **Performance**: JSONB fields enable efficient querying and indexing of nested data
- **Localization**: Language-specific fields for better content organization and querying

## 1.1 Core Dependencies

```bash
# Database and ORM
npm install drizzle-orm @supabase/supabase-js
npm install -D drizzle-kit

# Type Safety and Validation
npm install zod
npm install -D typescript @types/node
```

## 1.2 Database Configuration Pattern

The database setup follows a singleton pattern for connection management:

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { createClient } from '@supabase/supabase-js';
import * as schema from './schema';

// Singleton pattern for database connection
const createDb = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  return drizzle(supabase, { schema });
};

export const db = createDb();
```

## 1.3 Schema Pattern

The schema uses language-specific JSONB fields for localized content:

```typescript
// db/schema.ts
import { pgTable, text, timestamp, bigint, jsonb } from 'drizzle-orm/pg-core';

// Generic content page schema pattern
export const contentPage = pgTable('content_page', {
  // Identifiers
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  slug: text('slug').unique().notNull(),
  
  // SEO Fields
  keyword: text('keyword').notNull(),
  volume: bigint('volume', { mode: 'number' }),
  
  // Localized Content (JSONB for each language)
  en: jsonb('en'),                // English content
  ja: jsonb('ja'),                // Japanese content
  'zh-Hant': jsonb('zh-Hant'),    // Traditional Chinese
  ko: jsonb('ko'),                // Korean
  es: jsonb('es'),                // Spanish
  fr: jsonb('fr'),                // French
  pt: jsonb('pt'),                // Portuguese
  de: jsonb('de'),                // German
  it: jsonb('it'),                // Italian
  he: jsonb('he'),                // Hebrew
  ar: jsonb('ar'),                // Arabic
  
  // Search and Analytics
  googleSearchResult: jsonb('google_search_result'),
  
  // Audit Fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

## 1.4 Type System Pattern

Use discriminated unions and interfaces for type safety:

```typescript
// types/content.ts

// Language codes type
type LanguageCode = 'en' | 'ja' | 'zh-Hant' | 'ko' | 'es' | 'fr' | 'pt' | 'de' | 'it' | 'he' | 'ar';

// Base content structure for each language
interface LocalizedContent {
  meta: {
    title: string;
    description: string;
  };
  form: FormConfig;
  content: PageContent;
}

// Content type with all languages
interface ContentPage {
  id: number;
  slug: string;
  keyword: string;
  volume?: number;
  googleSearchResult?: any;
} & {
  [K in LanguageCode]?: LocalizedContent;
}

// Form configuration types
interface FormConfig {
  title: string;
  description: string;
  submitButtonText: string;
  fields: FormField[];
}

type FormField = TextField | NumberField | SelectField | TextAreaField;

interface BaseField {
  type: FieldType;
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

interface TextField extends BaseField {
  type: 'text';
  defaultValue?: string;
}

interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
}

// Export unified types
export type { ContentPage, LocalizedContent, FormConfig, FormField };
```

## 1.5 Migration Pattern

Create a type-safe migration system:

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  // Ensure case-insensitive naming
  formatOptions: {
    lowercase: true,
  },
} satisfies Config;
```


## Key Implementation Notes

1. **Localization Pattern**:
   - Use ISO language codes as field names
   - Store complete content structure in each language field
   - Keep language-independent data in root fields
   - Use TypeScript to ensure type safety across languages

2. **Content Organization**:
   - Each language field contains complete content
   - Shared data (like IDs, timestamps) at root level
   - Search results and analytics separate from content

3. **Query Patterns**:
   - Query by language: `select('en', 'ja')`
   - Filter by language existence: `where(isNotNull('en'))`
   - Join with translations: `leftJoin(translations)`

4. **Performance Considerations**:
   - Index frequently queried language fields
   - Use partial indexes for specific languages
   - Consider materialized views for common queries 