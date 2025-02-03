# Step 2: Page Implementation Patterns

## Why These Patterns?
- **Type Safety**: Strong typing for props and data structures
- **Component Composition**: Modular, reusable components
- **Performance**: Server components by default, client components when needed
- **Accessibility**: Built-in ARIA support and keyboard navigation
- **Maintainability**: Clear separation of concerns

## 2.1 Page Component Pattern

The page component follows these key patterns:

1. **Server Component by Default**:
```typescript
// app/[type]/[slug]/page.tsx
import { Metadata } from "next"
import { db } from "@/db"
import { contentPage } from "@/db/schema"
import { eq } from "drizzle-orm"

// Type-safe props
interface PageProps {
  params: {
    type: string;
    slug: string;
  }
}

// Metadata generation pattern
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await db.query.contentPage.findFirst({
    where: eq(contentPage.slug, params.slug)
  })

  return {
    title: page?.meta?.title,
    description: page?.meta?.description,
    // ... other metadata
  }
}

// Server component with error boundary
export default async function ContentPage({ params }: PageProps) {
  const page = await db.query.contentPage.findFirst({
    where: eq(contentPage.slug, params.slug)
  })

  if (!page) {
    notFound()
  }

  return (
    <PageLayout>
      <ContentRenderer content={page.content} />
      <FormRenderer config={page.form} />
    </PageLayout>
  )
}
```

2. **Component Composition Pattern**:
```typescript
// components/page-layout.tsx
export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

3. **Content Renderer Pattern**:
```typescript
// components/content-renderer.tsx
import { type ContentType } from "@/types"

interface ContentRendererProps {
  content: ContentType;
}

export function ContentRenderer({ content }: ContentRendererProps) {
  // Render different sections based on content type
  const sections = {
    hero: <HeroSection {...content.hero} />,
    features: <FeaturesGrid {...content.features} />,
    faq: <FaqAccordion {...content.faq} />,
  }

  return (
    <div className="space-y-16">
      {Object.entries(sections).map(([key, section]) => (
        <section key={key}>{section}</section>
      ))}
    </div>
  )
}
```

## 2.2 Form Pattern

The form implementation follows these patterns:

1. **Client Component with Type-Safe Validation**:
```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type FormConfig } from "@/types"

interface FormRendererProps {
  config: FormConfig;
}

export function FormRenderer({ config }: FormRendererProps) {
  // Dynamic schema generation
  const schema = createSchemaFromConfig(config)
  
  // Type-safe form hook
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(config)
  })

  return (
    <Form {...form}>
      <FormFields config={config} />
      <SubmitButton />
    </Form>
  )
}
```

2. **Dynamic Field Rendering Pattern**:
```typescript
function FormFields({ config }: { config: FormConfig }) {
  // Field type map
  const fieldComponents = {
    text: TextField,
    number: NumberField,
    select: SelectField,
    textarea: TextAreaField,
  }

  return config.fields.map(field => {
    const Component = fieldComponents[field.type]
    return <Component key={field.id} {...field} />
  })
}
```

3. **Field Component Pattern**:
```typescript
// Common field wrapper pattern
function FieldWrapper({ 
  label, 
  error, 
  children 
}: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

// Specific field implementations
function TextField({ field, ...props }: FieldProps) {
  return (
    <FieldWrapper {...props}>
      <Input {...field} />
    </FieldWrapper>
  )
}
```

## Key Implementation Notes

1. **Type Safety**:
   - Use TypeScript for all components
   - Validate props with Zod
   - Use discriminated unions for content types

2. **Performance**:
   - Use React Server Components
   - Implement proper code splitting
   - Optimize images and assets

3. **Accessibility**:
   - Follow ARIA patterns
   - Implement keyboard navigation
   - Use semantic HTML

4. **State Management**:
   - Keep form state local
   - Use React Query for server state
   - Implement optimistic updates

5. **Error Handling**:
   - Use error boundaries
   - Implement fallback UI
   - Provide helpful error messages 
