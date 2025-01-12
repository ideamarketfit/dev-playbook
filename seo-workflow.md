# SEO Workflow Implementation Guide

This guide explains how the SEO content generation workflow works. While we use the tool page as an example, this workflow can be applied to various page types such as tools, templates, blog posts, or any other content type requiring SEO optimization.

## Overview

The SEO workflow is a systematic process for generating SEO-optimized content using AI. It consists of:

1. Database schema for storing content
2. TypeScript interfaces for type safety
3. Prompt templates for AI generation
4. Workflow execution scripts

## 1. Database Schema (Supabase)

Each page type has its own table in Supabase. Here's an example using the `tool_page` table:

```typescript
// Example: tool_page table
interface ToolPage {
  id: bigint;              // Unique identifier
  keyword: text;           // Primary keyword for SEO
  slug: text;             // URL-friendly identifier
  volume: bigint;         // Search volume metric
  
  // Localized content as JSON
  en: PageContent;        // English content
  ja: PageContent;        // Japanese content
  'zh-Hant': PageContent; // Traditional Chinese
  // ... other language fields
}

// Similar structure can be used for other page types:
// - template_page
// - blog_page
// - landing_page
// etc.
```

## 2. Content Structure

Each page type defines its own content structure. Here's an example using the tool page structure:

```typescript
// Example: Tool page content structure
interface PageContent {
  meta: {
    title: string;        // SEO title (max 60 chars)
    description: string;  // Meta description (max 160 chars)
  };
  hero: {
    title: string;
    description: string;
    primaryCta: string;
    primaryCtaLink: string;
  };
  // ... other sections specific to the page type
}

// Other page types might have different structures:
interface BlogContent {
  meta: MetaSection;
  content: string;        // Main blog content
  tags: string[];
  author: AuthorInfo;
}

interface TemplateContent {
  meta: MetaSection;
  sections: TemplateSection[];
  downloadUrl: string;
}
```

## 3. AI Prompt Template

Each page type has its own prompt template optimized for its content type:

```typescript
// Example: Tool page prompt
export const createToolPagePrompt = (keyword: string) => `
  Generate engaging marketing content for a ${keyword} tool...
`;

// Example: Blog page prompt
export const createBlogPrompt = (topic: string) => `
  Write an informative blog post about ${topic}...
`;

// Example: Template page prompt
export const createTemplatePrompt = (category: string) => `
  Generate content for a ${category} template...
`;
```

## 4. Workflow Implementation

### 4.1 Core Workflow Structure

```typescript
// utils/seo-workflow/common-workflow.ts
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from '@langchain/openai';

export interface WorkflowConfig {
  tableName: string;
  createPrompt: (keyword: string) => string;
  validateContent: (content: any) => boolean;
}

export async function executeWorkflow(
  tableName: string,
  rowId: number,
  config: WorkflowConfig
) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // 1. Fetch row data
    const { data: row, error } = await supabase
      .from(tableName)
      .select('keyword')
      .eq('id', rowId)
      .single();

    if (error || !row) {
      throw new Error(`Row ${rowId} not found: ${error?.message}`);
    }

    // 2. Generate content using AI
    const prompt = config.createPrompt(row.keyword);
    const completion = await openai.complete({
      model: 'gpt-4',
      prompt,
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = JSON.parse(completion.choices[0].text);

    // 3. Validate generated content
    if (!config.validateContent(content)) {
      throw new Error('Generated content failed validation');
    }

    // 4. Update database
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ en: content })
      .eq('id', rowId);

    if (updateError) {
      throw new Error(`Failed to update row ${rowId}: ${updateError.message}`);
    }

    return content;
  } catch (error) {
    console.error(`Workflow failed for row ${rowId}:`, error);
    throw error;
  }
}
```

### 4.2 Page-Specific Workflow

```typescript
// utils/seo-workflow/tool-page-workflow.ts
import { WorkflowConfig } from './common-workflow';
import { createToolPagePrompt } from '@/lib/prompts/tool-page-prompt';
import { ToolPageContent } from '@/lib/types/tool-page';
import { z } from 'zod';

// Validation schema
const toolPageSchema = z.object({
  meta: z.object({
    title: z.string().max(60),
    description: z.string().max(160)
  }),
  hero: z.object({
    title: z.string(),
    description: z.string(),
    primaryCta: z.string(),
    primaryCtaLink: z.string()
  }),
  // ... other sections
});

export const tool_page_workflow: WorkflowConfig = {
  tableName: 'tool_page',
  createPrompt: createToolPagePrompt,
  validateContent: (content: unknown): content is ToolPageContent => {
    return toolPageSchema.safeParse(content).success;
  }
};
```

### 4.3 Batch Processing Implementation

```typescript
// utils/seo-workflow/run-workflow.ts
#!/usr/bin/env node
import { executeWorkflow } from './common-workflow';
import { tool_page_workflow } from './tool-page-workflow';
import { template_page_workflow } from './template-page-workflow';

async function processBatch(
  startId: number,
  endId: number,
  workflow: WorkflowConfig
) {
  console.log(`Processing batch from ID ${startId} to ${endId}`);
  
  for (let rowId = startId; rowId <= endId; rowId++) {
    try {
      console.log(`\nProcessing row ID ${rowId}...`);
      const result = await executeWorkflow(workflow.tableName, rowId, workflow);
      console.log(`✓ Row ${rowId} completed successfully!`);
      
      // Add delay between requests to respect rate limits
      if (rowId < endId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`✗ Failed for row ${rowId}:`, error);
      // Continue with next row even if current one fails
      continue;
    }
  }
}

async function main() {
  const [workflowType, idInput] = process.argv.slice(2);
  
  if (!workflowType || !idInput) {
    console.error('Usage: yarn workflow <workflow-type> <rowId or startId-endId>');
    console.error('Examples:\n  yarn workflow tool-page 1\n  yarn workflow tool-page 1-5');
    process.exit(1);
  }

  // Parse ID range
  let startId: number;
  let endId: number;

  if (idInput.includes('-')) {
    [startId, endId] = idInput.split('-').map(id => parseInt(id));
    if (isNaN(startId) || isNaN(endId) || startId > endId) {
      console.error('Invalid ID range. Format should be: startId-endId (e.g., 1-5)');
      process.exit(1);
    }
  } else {
    startId = endId = parseInt(idInput);
    if (isNaN(startId)) {
      console.error('Invalid row ID. Must be a number.');
      process.exit(1);
    }
  }

  // Select workflow
  let workflow: WorkflowConfig;
  switch (workflowType) {
    case 'tool-page':
      workflow = tool_page_workflow;
      break;
    case 'template-page':
      workflow = template_page_workflow;
      break;
    default:
      console.error(`Unknown workflow type: ${workflowType}`);
      process.exit(1);
  }

  try {
    await processBatch(startId, endId, workflow);
    console.log('\n✓ All rows processed successfully!');
  } catch (error) {
    console.error('\n✗ Workflow failed:', error);
    process.exit(1);
  }
}

main();
```

### 4.4 Running the Workflow

```bash
# Process a single row
yarn workflow tool-page 1

# Process multiple rows (e.g., rows 1 through 5)
yarn workflow tool-page 1-5

# Process template pages
yarn workflow template-page 1-10
```

Example output:
```bash
Processing batch from ID 1 to 5

Processing row ID 1...
✓ Row 1 completed successfully!

Processing row ID 2...
✓ Row 2 completed successfully!

Processing row ID 3...
✗ Failed for row 3: Generated content failed validation

Processing row ID 4...
✓ Row 4 completed successfully!

Processing row ID 5...
✓ Row 5 completed successfully!

✓ All rows processed successfully!
```

### 4.5 Environment Setup

```env
# .env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...
```

## 5. Running the Workflow

1. **Setup**
   ```bash
   # Install dependencies
   npm install

   # Configure environment
   cp .env.example .env
   # Add required API keys and database credentials
   ```

2. **Execution**
   ```bash
   # Generate content for a single tool page
   yarn workflow tool-page 1

   # Generate content for multiple tool pages
   yarn workflow tool-page 1-20
   ```

3. **Monitoring**
   - Progress is logged to console
   - Results are displayed in JSON format
   - Errors are captured and reported

## 6. Best Practices

1. **Content Generation**
   - Use specific, targeted keywords
   - Maintain consistent tone and style
   - Follow SEO best practices
   - Adapt content structure to page type
   - Consider unique requirements of each content type

2. **Workflow Management**
   - Process pages in small batches
   - Monitor API rate limits
   - Implement proper error handling
   - Cache results when possible
   - Use appropriate workflow for each page type

3. **Quality Control**
   - Validate against page-specific schemas
   - Check keyword optimization
   - Ensure content uniqueness
   - Review meta descriptions and titles
   - Apply content type-specific validation rules

## 7. Common Issues and Solutions

1. **API Rate Limits**
   - Implement delay between requests
   - Use batch processing
   - Handle rate limit errors gracefully

2. **Content Quality**
   - Validate against content guidelines
   - Check keyword density
   - Ensure proper formatting
   - Verify character limits

3. **Database Operations**
   - Handle connection errors
   - Implement retries for failed operations
   - Validate data before insertion

## 8. Testing

```typescript
describe('SEO Workflow', () => {
  // Test different page types
  it('should generate valid tool page content', async () => {
    const result = await executeWorkflow('tool_page', 1, tool_page_workflow);
    expect(result).toMatchSchema(ToolPageContent);
  });

  it('should generate valid template page content', async () => {
    const result = await executeWorkflow('template_page', 1, template_page_workflow);
    expect(result).toMatchSchema(TemplatePageContent);
  });

  it('should generate valid blog page content', async () => {
    const result = await executeWorkflow('blog_page', 1, blog_page_workflow);
    expect(result).toMatchSchema(BlogPageContent);
  });
});
```

## 9. Extending to New Page Types

To add a new page type to the workflow:

1. Create a new database table for the page type
2. Define the TypeScript interface for the content structure
3. Create a prompt template specific to the content type
4. Implement the workflow logic
5. Add the new workflow type to the CLI handler
6. Create appropriate tests

Example:
```typescript
// 1. Database table: product_page
// 2. Interface
interface ProductPageContent {
  meta: MetaSection;
  specifications: ProductSpecs;
  pricing: PricingInfo;
  // ... other sections
}

// 3. Prompt
export const createProductPrompt = (product: string) => `
  Generate product page content for ${product}...
`;

// 4. Workflow
export const product_page_workflow = async (id: number) => {
  // Implementation
};

// 5. CLI handler
case 'product-page':
  workflow = product_page_workflow;
  tableName = 'product_page';
  break;
``` 