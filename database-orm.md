# Using Drizzle with Supabase

This guide explains how to use Drizzle ORM with Supabase in our project.

## Setup

1. Environment Variables

You'll need to set up the following environment variables:
```env
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_POOL_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres
```

Note: The `DATABASE_POOL_URL` uses port 6543 for connection pooling.

2. Configuration

The Drizzle configuration is in `drizzle.config.ts`:
```typescript
export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Required Packages

Install the following packages:

```bash
npm install drizzle-orm postgres @types/pg
npm install -D drizzle-kit
```

Package versions and their purposes:
- `drizzle-orm`: Core ORM functionality
- `postgres`: PostgreSQL client for Node.js
- `@types/pg`: TypeScript types for PostgreSQL
- `drizzle-kit`: Development tools for migrations and schema management

Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Schema Definition

Schemas are defined in `db/schema.ts` using Drizzle's type-safe schema builder. Example:

```typescript
import { pgTable, varchar, integer, timestamp, text, uuid } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  name: varchar('name', { length: 255 }).notNull(),
  projectId: uuid('project_id').notNull(),
});
```

## Database Connection

The database connection is configured in `db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const client = postgres(process.env.DATABASE_POOL_URL!, { prepare: false });
export const db = drizzle(client);
```

## Usage Examples

1. Select Records:
```typescript
const documents = await db.select().from(documents);
```

2. Insert Records:
```typescript
const newDocument = await db.insert(documents).values({
  name: 'New Document',
  projectId: projectId,
}).returning();
```

3. Update Records:
```typescript
const updatedDocument = await db.update(documents)
  .set({ name: 'Updated Name' })
  .where(eq(documents.id, documentId))
  .returning();
```

4. Delete Records:
```typescript
const deletedDocument = await db.delete(documents)
  .where(eq(documents.id, documentId))
  .returning();
```

## Migrations

There are two ways to manage your database schema changes:

### 1. Using Push (Development Only)

For quick development and prototyping, you can use the push command to directly update your database schema:

```bash
npm run drizzle-kit push:pg
```

⚠️ **Warning**: Push commands should only be used in development. They directly modify your database schema without creating migration files, making it difficult to track changes and potentially dangerous in production.

### 2. Using Migrations (Recommended for Production)

For production and proper version control of your database schema:

1. Generate migration files:
```bash
npm run drizzle-kit generate:pg
```

2. Apply migrations:
```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator';

await migrate(db, { migrationsFolder: './drizzle' });
```

3. Track migrations:
```bash
# After generating migrations, commit them to version control
git add drizzle/*
git commit -m "feat: add new migrations"
```

### Migration Best Practices

1. Never modify existing migration files
2. Always test migrations on a development database first
3. Back up production database before applying migrations
4. Run migrations during off-peak hours
5. Have a rollback plan for each migration
6. Use transactions for complex migrations

## Best Practices

1. Always use the connection pool URL for production environments
2. Keep schema definitions organized and well-documented
3. Use TypeScript for type safety with Drizzle's schema definitions
4. Generate and track migrations for all schema changes
5. Use prepared statements when possible for better security and performance

## Troubleshooting

Common issues and solutions:

1. Connection Issues
   - Verify your Supabase connection string
   - Check if the database is accessible from your network
   - Ensure proper SSL configuration

2. Migration Problems
   - Make sure all migrations are committed to version control
   - Run migrations in order
   - Back up data before running migrations in production

For more information, refer to:
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs) 

## Usage with Next.js Server Actions

Server Actions allow you to run database operations directly from your components. Here's how to use Drizzle with Server Actions:

1. Create a server-side file (e.g., `app/lib/storage.ts`):
```typescript
'use server'

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { documents, documentVersions } from "@/db/schema";

// Example of a server action to create a document
export async function createDocument(id: string, name: string, projectId: string) {
    const document = await db.insert(documents).values({
        id: id,
        name: name,
        projectId: projectId
    }).returning();

    return document[0] ?? null;
}

// Example of a server action with complex joins
export async function getProjectDocuments(projectId: string) {
    const result = await db
        .select({
            document: {
                id: documents.id,
                name: documents.name,
            },
            version: {
                id: documentVersions.id,
                content: documentVersions.content,
            }
        })
        .from(documents)
        .leftJoin(
            documentVersions,
            eq(documents.id, documentVersions.documentId)
        )
        .where(eq(documents.projectId, projectId));

    return result;
}
```

2. Use in your components:
```typescript
// In your component
import { createDocument } from '@/app/lib/storage';

export default function DocumentForm() {
    async function handleSubmit(formData: FormData) {
        'use server'
        
        const name = formData.get('name');
        const projectId = formData.get('projectId');
        
        await createDocument(
            crypto.randomUUID(),
            name as string,
            projectId as string
        );
    }

    return (
        <form action={handleSubmit}>
            {/* form fields */}
        </form>
    );
}
```

### Best Practices for Server Actions

1. Always mark your server action files with `'use server'` at the top
2. Keep database operations in separate server-side files
3. Use TypeScript for better type safety
4. Handle errors appropriately and return null/undefined for not found cases
5. Use transactions for operations that modify multiple tables
6. Consider implementing optimistic updates for better UX

### Error Handling

```typescript
export async function updateDocument(id: string, data: UpdateData) {
    try {
        const document = await db.update(documents)
            .set(data)
            .where(eq(documents.id, id))
            .returning();

        return document[0] ?? null;
    } catch (error) {
        // Log the error appropriately
        console.error('Failed to update document:', error);
        return null;
    }
}
```