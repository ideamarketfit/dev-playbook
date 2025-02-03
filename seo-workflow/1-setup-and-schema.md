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

# AI and Content Generation
npm install @anthropic-ai/sdk ai

# Web Scraping and Analysis
npm install axios cheerio

# Development Tools
npm install -D tsx ts-node
```

## 1.2 Project Structure

```
├── utils/
│   └── seo-workflow/
│       ├── configurations/    # Workflow configurations
│       │   ├── tool-page-seo-workflow.ts
│       │   └── template-page-seo-workflow.ts
│       ├── prompts/          # AI prompts
│       │   ├── content-prompt.ts
│       │   └── form-prompt.ts
│       ├── common-function.ts # Shared utilities
│       └── run-workflow.ts   # Workflow runner
├── types/                    # TypeScript types
│   ├── content.ts
│   └── workflow.ts
├── db/                       # Database
│   ├── schema.ts
│   └── index.ts
└── .env                      # Environment variables
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

## 1.6 Environment Setup

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DATABASE_URL=postgres://your_connection_string

# AI Model Configuration
NEXT_PUBLIC_SEO_MODEL=claude-3-sonnet-20240229
ANTHROPIC_API_KEY=your_api_key

# Search Configuration (Optional)
GOOGLE_SEARCH_KEY=your_search_key
GOOGLE_SEARCH_ID=your_search_engine_id
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

## Common Issues and Solutions

1. **Database Connection**:
   ```typescript
   // Handle connection timeouts
   const createDb = (retries = 3) => {
     try {
       return drizzle(/* ... */);
     } catch (error) {
       if (retries > 0) {
         return createDb(retries - 1);
       }
       throw error;
     }
   };
   ```

2. **JSONB Querying**:
   ```typescript
   // Efficient JSONB path queries
   const query = db
     .select()
     .from(contentPage)
     .where(sql`${contentPage.en}->>'title' = ${title}`);
   ```

3. **Type Safety**:
   ```typescript
   // Runtime type checking
   const validateContent = (data: unknown): LocalizedContent => {
     return contentSchema.parse(data);
   };
   ```

## Testing Patterns

1. **Schema Testing**:
```typescript
// tests/schema.test.ts
describe('Content Schema', () => {
  it('should validate correct content structure', () => {
    const content: LocalizedContent = {
      meta: {
        title: 'Test',
        description: 'Test description'
      },
      form: {/* ... */},
      content: {/* ... */}
    };
    expect(validateContent(content)).toBeDefined();
  });
});
```

2. **Database Testing**:
```typescript
// tests/db.test.ts
describe('Database Operations', () => {
  it('should handle concurrent writes', async () => {
    const results = await Promise.all([
      createContent({ /* ... */ }),
      createContent({ /* ... */ })
    ]);
    expect(results).toHaveLength(2);
  });
});
``` 