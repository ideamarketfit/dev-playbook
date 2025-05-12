# 0 - Programmatic SEO Page Generation Step-by-Step Guide

This guide explains how to automatically generate and serve SEO-optimized pages (services, blog posts, tools) with internationalization, using Postgres + Drizzle + LLMs in Next.js 14+.

## Project Structure

Here's a sample layout for the files involved in page generation:

```text
project-root/
├── db/
│   ├── index.ts          # Drizzle client
│   └── schema.ts         # Table definitions (e.g. `service_page`, etc.)
├── lib/
│   ├── workflow-utils.ts # reusable helpers (`toSlug`, `llm`, `googleSearch`, `concatenateFields`)
│   └── page-service.ts   # data fetching helpers
├── scripts/
│   └── run-workflow.ts   # workflow runner CLI with Drizzle integration
├── utils/seo-workflow/
│   ├── configurations/
│   │   └── service-page-seo-workflow.ts  # core workflow definition
│   └── prompts/
│       ├── service-page-content-prompt.ts
│       └── service-form-prompt.ts
└── package.json          # defines `generate-page` script
```

## 1. Copy Shared Workflow Utilities

From `dev-playbook/common-component/`, copy these into your project:

```bash
# Locale detection middleware
cp dev-playbook/common-component/middleware.ts middleware.ts

# i18n loader and locale list
cp dev-playbook/common-component/i18n.ts lib/i18n.ts

# Page data services
cp dev-playbook/common-component/page-service.ts lib/page-service.ts

# Workflow helper functions
cp dev-playbook/common-component/workflow-utils.ts lib/workflow-utils.ts

# SEO head component
cp dev-playbook/common-component/SEOHead.tsx components/SEOHead.tsx

# Localized link and path utils
cp dev-playbook/common-component/LocalizedLink.tsx components/LocalizedLink.tsx
cp dev-playbook/common-component/pathUtils.ts lib/pathUtils.ts

# Language selector UI
cp dev-playbook/common-component/language-switcher.tsx components/language-switcher.tsx

# Hreflang tag injector
cp dev-playbook/common-component/hreflang-tags.tsx components/hreflang-tags.tsx
```

> **Note:** Adjust paths to fit your project's `lib/`, `components/`, and `app/` structure.

## 2. Install Dependencies

These utilities require:

- `drizzle-orm` & `postgres` for DB access
- `@anthropic-ai/sdk` & `openai` for LLM calls
- `axios` & `cheerio` for optional web crawling
- `lucide-react` and your select UI lib for language switcher

Example:
```bash
npm install drizzle-orm postgres @anthropic-ai/sdk openai axios cheerio lucide-react
```

## 3. Configure Database Connection & Schema

1. In `db/index.ts`, connect to Postgres and export the `db` object.
2. Define your table (e.g. `service_page`) in `db/schema.ts` with:
   - `id`, `slug`, `keyword` columns
   - JSONB columns per locale (`en`, `ja`, etc.) with `page_content`
   - Optional fields (`form_config`, `featured`, `google_search_result`)
3. Push schema changes:
```bash
npx drizzle-kit push
```

4. Configure Drizzle CLI with schema and table filters

Create a `drizzle.config.ts` in your project root:

```ts
import { defineConfig } from 'drizzle-kit';
import { DATABASE_URL } from './config'; // adjust as needed

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  schemaFilter: ['public'], // only generate/migrate tables in the 'public' schema
  tablesFilter: ['service_page', 'chat', 'chat_messages'], // only target these tables
});
```

+ **Note:** The `schemaFilter` and `tablesFilter` arrays shown above are examples and should be customized to match your project's actual schemas and tables (e.g., `product_page`, `blog_post`, etc.).

**Why use filters?**
- `schemaFilter`: restricts Drizzle CLI to specified schemas, preventing unintended changes in other DB schemas.
- `tablesFilter`: narrows operations to listed tables, improving safety by excluding unrelated tables and speeding up introspection.

### Example `db/schema.ts` with Drizzle ORM
```ts
import { pgTable, serial, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const service_page = pgTable('service_page', {
  id: serial('id')
    .primaryKey()
    .notNull()
    .describe('Primary key for the page'),
  slug: text('slug')
    .unique()
    .notNull()
    .describe('URL-friendly identifier used in routing'),
  keyword: text('keyword')
    .notNull()
    .describe('Main SEO keyword for the page'),
  context: text('context')
    .notNull()
    .describe('Contextual info or prompt input for the LLM'),
  en: jsonb('en')
    .notNull()
    .describe('Generated page content in English locale'),
  ja: jsonb('ja')
    .notNull()
    .describe('Generated page content in Japanese locale'),
  form_config: jsonb('form_config')
    .describe('Optional configuration object for forms on the page'),
  featured: boolean('featured')
    .default(false)
    .describe('Flag indicating a featured page'),
  google_search_result: jsonb('google_search_result')
    .describe('Raw Google search data used during content generation'),
  created_at: timestamp('created_at')
    .defaultNow()
    .notNull()
    .describe('Timestamp when the record was created'),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .onUpdateNow()
    .notNull()
    .describe('Timestamp of the last update'),
});
```

## 4. Set Up Prompts & Workflow Configuration

1. Create prompt files (in `utils/seo-workflow/prompts/`):
   - `service-page-content-prompt.ts`
   - `service-form-prompt.ts`
2. Define the workflow steps (in `utils/seo-workflow/configurations/service-page-seo-workflow.ts`) using:
   - `toSlug`, `googleSearch`, `llm`, `concatenateFields` from `workflow-utils`
   - Prompt generators (`createServicePageContentPrompt`, etc.)

### Workflow Definition Example
Below is a snippet from `utils/seo-workflow/configurations/service-page-seo-workflow.ts`. Use this as a template for your own workflow, replacing `service_page` and prompt functions as needed.
```ts
import { googleSearch, llm, toSlug, concatenateFields, type WorkflowStep, type ParallelledExecutionStep } from '@/common-component/workflow-utils';
import { createServicePageContentPrompt, createServiceFormPrompt } from '../prompts';

export const service_page_workflow: WorkflowStep[] = [
  {
    type: 'slug',
    input: { keyword: { type: 'db_field', field: 'keyword' } },
    output: 'slug',
    function: toSlug,
  },
  {
    type: 'llm',
    name: 'Generate Service Page Content',
    input: {
      system_msg: createServicePageContentPrompt(),
      user_msg: [
        { type: 'db_field', field: 'keyword' },
        { type: 'db_field', field: 'context' },
      ],
      model: process.env.NEXT_PUBLIC_SEO_MODEL!,
      json: true,
    },
    output: 'page_content',
    function: llm,
  },
  // Add additional steps like form config or translations here...
];
```

## 5. Copy & Configure the Workflow Runner

1. Copy the runner script into your scripts folder:
```bash
cp utils/seo-workflow/run-workflow.ts scripts/run-workflow.ts
```

2. The copied `scripts/run-workflow.ts` now contains the core `runWorkflow` function. Add a CLI entry point at the bottom of that file so it can be invoked directly. For example:
```ts
if (require.main === module) {
  const args = process.argv.slice(2)
  const [workflowType, idInput] = args
  if (!workflowType || !idInput) {
    console.error('Usage: generate-page <workflowType> <id|start-end|id,id>')
    process.exit(1)
  }
  runWorkflow({ workflowType, idInput })
    .then(result => {
      if (result.success) {
        console.log('Processed IDs:', result.processedIds)
        process.exit(0)
      } else {
        console.error('Errors:', result.errors)
        process.exit(1)
      }
    })
    .catch(err => {
      console.error('Workflow failed:', err)
      process.exit(1)
    })
}
```

> **Table Name Note:** The default `workflowType` is `service_page`, matching the example. You must rename all occurrences of `service_page` (schema, prompt config, workflow constant, and invocation) to your own table name (e.g. `product_page`, `blog_post`).

> **Import Paths:** After copying, adjust imports in `scripts/run-workflow.ts` so that:
> - `runWorkflow` comes from `./run-workflow` (itself)
> - Your Drizzle client exports come from `db/index.ts`
> - Prompts and configurations are referenced relative to the new `scripts/` location.

> **Drizzle Usage:** The runner leverages your Drizzle ORM client in `db/index.ts` for all DB reads/writes—no Supabase client is used.

## 6. Add Workflow Entry Point Script

In your `package.json`, add the `generate-page` script:
```json
"scripts": {
  "generate-page": "tsx scripts/run-workflow.ts"
}
```

Run with two positional args:
```bash
npm run generate-page -- <workflowType> <id|start-end|id,id>
```

Examples:
```bash
# Single row (ID 1) for service_page
npm run generate-page -- service_page 1

# Range of IDs 5 through 10 for blog_post
npm run generate-page -- blog_post 5-10
```

## 7. Run the Workflow

1. Insert a new row in your table (replace `service_page` with your table name):
```sql
INSERT INTO service_page (keyword, context)
VALUES ('Your Service', 'Detailed context') RETURNING id;
```

2. Execute the generation step:
```bash
npm run generate-page -- service_page <rowId>
```

3. Verify the generated fields (`slug`, `page_content`, `form_config`, and any locale columns) in your database:
```bash
psql $DATABASE_URL -c "SELECT slug, page_content FROM service_page WHERE id = <rowId>;"
```

---

By completing these steps—including renaming `service_page`, adding the CLI wrapper, and adjusting imports—another engineer can follow this guide exactly and produce fully generated SEO pages without manual errors.

For instructions on scaffolding routes and rendering pages, see `0-i18n-static-page-step-guide.md` and `0-i18n-programmatic-seo-pages-step-guide.md`.