# Step 3: Workflow and Prompt System Patterns

## Why These Patterns?
- **Modularity**: Each workflow step is independent and composable
- **Type Safety**: Strong typing for inputs and outputs
- **Flexibility**: Easy to add new workflows and prompts
- **Maintainability**: Clear separation of concerns
- **Testability**: Each component can be tested in isolation

## 3.1 Core Workflow Patterns

1. **Step Definition Pattern**:
```typescript
// types/workflow.ts
interface WorkflowStep {
  // Input definition with type discrimination
  input: {
    [key: string]: {
      type: 'db_field' | 'static' | 'computed';
      field?: string;
      value?: any;
      compute?: (context: any) => any;
    };
  };
  // Output field name
  output: string;
  // Step function
  function: (input: any) => Promise<any>;
}

// Example step implementation
const slugifyStep: WorkflowStep = {
  input: {
    text: { type: 'db_field', field: 'keyword' }
  },
  output: 'slug',
  function: async ({ text }) => text.toLowerCase().replace(/\s+/g, '-')
};
```

2. **Context Management Pattern**:
```typescript
// utils/workflow/context.ts
class WorkflowContext {
  private data: Record<string, any> = {};
  
  // Type-safe get/set
  get<T>(key: string): T {
    return this.data[key] as T;
  }
  
  set(key: string, value: any): void {
    this.data[key] = value;
  }
  
  // Merge new data
  merge(newData: Record<string, any>): void {
    this.data = { ...this.data, ...newData };
  }
}
```

## 3.2 Prompt System Patterns

1. **Base Prompt Pattern**:
```typescript
// utils/prompts/base.ts
abstract class BasePrompt<T> {
  protected abstract systemMessage: string;
  
  // Template method pattern
  async generate(input: any): Promise<T> {
    const prompt = this.buildPrompt(input);
    const response = await this.execute(prompt);
    return this.parseResponse(response);
  }
  
  protected abstract buildPrompt(input: any): string;
  protected abstract parseResponse(response: any): T;
  
  private async execute(prompt: string): Promise<any> {
    return llm({
      systemMessage: this.systemMessage,
      userMessage: prompt,
      temperature: 0,
      format: 'json'
    });
  }
}
```

2. **Content Generation Pattern**:
```typescript
// utils/prompts/content.ts
class ContentPrompt extends BasePrompt<ContentType> {
  protected systemMessage = `
    You are an expert content generator.
    Generate content following these guidelines:
    1. Use natural, engaging language
    2. Optimize for SEO
    3. Follow brand voice
    4. Include all required sections
  `;
  
  protected buildPrompt(input: ContentInput): string {
    return `
      Generate content for: ${input.keyword}
      Target audience: ${input.audience}
      Tone: ${input.tone}
    `;
  }
  
  protected parseResponse(response: any): ContentType {
    // Validate response structure
    return contentSchema.parse(response);
  }
}
```

## 3.3 Workflow Implementation Pattern

1. **Workflow Definition**:
```typescript
// utils/workflows/content-workflow.ts
export const contentWorkflow: WorkflowStep[] = [
  // 1. Generate slug
  {
    input: {
      text: { type: 'db_field', field: 'keyword' }
    },
    output: 'slug',
    function: slugify
  },
  
  // 2. Research phase
  {
    input: {
      keyword: { type: 'db_field', field: 'keyword' },
      config: { type: 'static', value: searchConfig }
    },
    output: 'research',
    function: performResearch
  },
  
  // 3. Content generation
  {
    input: {
      keyword: { type: 'db_field', field: 'keyword' },
      research: { type: 'computed', compute: ctx => ctx.research }
    },
    output: 'content',
    function: generateContent
  }
];
```

2. **Workflow Execution Pattern**:
```typescript
// utils/workflows/runner.ts
export class WorkflowRunner {
  private context: WorkflowContext;
  
  constructor(private steps: WorkflowStep[]) {
    this.context = new WorkflowContext();
  }
  
  async execute(initialData: Record<string, any>): Promise<any> {
    // Initialize context
    this.context.merge(initialData);
    
    // Execute steps sequentially
    for (const step of this.steps) {
      try {
        // Prepare step input
        const input = this.prepareInput(step.input);
        
        // Execute step
        const result = await step.function(input);
        
        // Update context
        this.context.set(step.output, result);
        
      } catch (error) {
        this.handleError(error, step);
      }
    }
    
    return this.context;
  }
  
  private prepareInput(inputDef: WorkflowStep['input']): any {
    return Object.entries(inputDef).reduce((acc, [key, def]) => {
      switch (def.type) {
        case 'db_field':
          acc[key] = this.context.get(def.field!);
          break;
        case 'static':
          acc[key] = def.value;
          break;
        case 'computed':
          acc[key] = def.compute!(this.context);
          break;
      }
      return acc;
    }, {} as Record<string, any>);
  }
}
```

## Key Implementation Notes

1. **Type Safety**:
   - Use TypeScript for all workflow definitions
   - Validate inputs and outputs
   - Use discriminated unions for step types

2. **Error Handling**:
   - Implement proper error boundaries
   - Log errors with context
   - Allow workflow recovery

3. **Testing**:
   - Unit test individual steps
   - Integration test workflows
   - Mock external services

4. **Performance**:
   - Implement caching where appropriate
   - Use batch processing for multiple items
   - Monitor execution times

5. **Monitoring**:
   - Log workflow progress
   - Track success/failure rates
   - Measure execution times

## 3.4 Create Base Prompt Types

```typescript
// types/prompt.ts
export interface PromptInput {
  keyword: string;
  googleSearchResult?: any;
}

export interface WorkflowStep {
  input: {
    [key: string]: {
      type: 'db_field';
      field: string;
    } | string[];
  };
  output: string;
  function: Function;
}
```

## 3.5 Implement Content Generation Prompts

### Page Content Prompt
```typescript
// utils/seo-workflow/prompts/seo-page-content-prompt.ts
import { type SeoPageContent } from '@/types/seo-page';

export function createSeoPageContentPrompt(): string {
  return `You are an expert in creating compelling SEO-optimized content. Your task is to generate comprehensive, well-structured content that drives conversions.

Input Format:
You will receive a keyword that describes the content type (e.g., "case study writing", "logo design").

Output Format:
Return ONLY a JSON object matching this TypeScript interface:

interface SeoPageContent {
  meta: {
    title: string;        // SEO-optimized page title
    description: string;  // Compelling meta description
  };
  hero: {
    tag: string;         // Short category/type
    title: string;       // Main page heading
    description: string; // Engaging overview
  };
  "service-description": {
    title: string;       // Section heading
    description: string; // Detailed explanation
  };
  features: {
    title: string;
    features: Array<{
      icon: string;      // Icon name from: Search, Database, BarChart, FileCheck
      title: string;     // Feature name
      description: string;// Feature explanation
    }>;
  };
  tools: {
    title: string;
    sections: Array<{
      title: string;     // Tool category
      items: string[];   // List of tools/capabilities
    }>;
  };
  "final-output": {
    title: string;
    components: {
      title: string;
      items: string[];   // Deliverable components
    };
    sample: {
      title: string;
      content: string;   // Sample output structure
    };
  };
  "quality-criteria": {
    title: string;
    criteria: Array<{
      title: string;     // Quality category
      items: string[];   // Quality checkpoints
    }>;
  };
  faq: {
    title: string;
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
}

Guidelines:
1. Content Strategy
   - Focus on value proposition and benefits
   - Use clear, action-oriented language
   - Maintain consistent professional tone
   - Include social proof elements
   - Address user pain points

2. SEO Optimization
   - Use keyword naturally throughout content
   - Create compelling meta title/description
   - Structure content with proper headings
   - Include relevant related terms
   - Focus on user intent

3. Feature Presentation
   - Highlight unique selling points
   - Use clear, benefit-driven descriptions
   - Choose appropriate icons
   - Group related features
   - Focus on outcomes

4. Quality Standards
   - Define clear quality criteria
   - Include measurable standards
   - Set realistic expectations
   - Reference industry standards
   - Include verification methods

5. FAQ Section
   - Address common objections
   - Use natural question format
   - Provide detailed answers
   - Include technical details
   - Cover pricing/timeline questions

IMPORTANT: Return ONLY the JSON object without any additional text or formatting.`;
}
```

### Form Configuration Prompt
```typescript
// utils/seo-workflow/prompts/seo-form-prompt.ts
import { type FormConfig } from '@/types/seo-page';

export function createSeoFormPrompt(): string {
  return `Generate a form configuration for collecting necessary information from users.

Output Format:
Return ONLY a JSON object matching this TypeScript interface:

interface FormConfig {
  title: string;           // Form title
  description: string;     // Form description
  submitButtonText: string;// Submit button text
  serviceType: string;     // Type of service
  fields: Array<{
    id: string;           // Unique field identifier
    label: string;        // Field label
    type: "text" | "number" | "select" | "textarea";
    required?: boolean;   // Is field required?
    placeholder?: string; // Placeholder text
    defaultValue?: string | number;
    min?: number;        // For number fields
    max?: number;        // For number fields
    step?: number;       // For number fields
    unit?: string;       // For number fields
    rows?: number;       // For textarea
    options?: Array<{    // For select fields
      id: string;
      label: string;
    }>;
  }>;
  config?: {
    model: string;       // AI model to use
    orchestrator: string;// Workflow orchestrator
  };
}

Guidelines:
1. Field Types
   - Use appropriate field types for data
   - Include validation constraints
   - Group related fields
   - Use clear labels and placeholders

2. User Experience
   - Keep form focused and minimal
   - Use clear, action-oriented labels
   - Include helpful placeholder text
   - Mark required fields appropriately

3. Validation
   - Add appropriate min/max values
   - Include step values for numbers
   - Set reasonable defaults
   - Use clear validation messages

IMPORTANT: Return ONLY the JSON object without any additional text or formatting.`;
}
```

## 3.6 Implement Workflow Configuration

```typescript
// utils/seo-workflow/configurations/seo-page-workflow.ts
import { googleSearch, llm, toSlug, concatenateFields, type WorkflowStep } from '../common-function';
import { createSeoPageContentPrompt } from '../prompts/seo-page-content-prompt';
import { createSeoFormPrompt } from '../prompts/seo-form-prompt';

// Use the model from environment variable
const default_model = process.env.NEXT_PUBLIC_SEO_MODEL || 'claude-3-sonnet-20240229';

export const seo_page_workflow: WorkflowStep[] = [
  // Step 1: Generate SEO-friendly slug
  {
    input: {
      "keyword": { type: 'db_field' as const, field: 'keyword' }
    },
    output: "slug",
    function: toSlug
  },
  
  // Step 2: Perform Google search for competitive analysis
  {
    input: {
      "keyword": { type: 'db_field' as const, field: 'keyword' }
    },
    output: "google_search_result",
    function: googleSearch
  },
  
  // Step 3: Generate Form Configuration
  {
    input: {
      "system_msg": createSeoFormPrompt(),
      "user_msg": [
        { type: 'db_field' as const, field: 'keyword' }
      ],
      "model": default_model,
      "json": true,
    },
    output: "form_config",
    function: llm
  },
  
  // Step 4: Generate Page Content
  {
    input: {
      "system_msg": createSeoPageContentPrompt(),
      "user_msg": [
        { type: 'db_field' as const, field: 'keyword' },
        { type: 'db_field' as const, field: 'google_search_result' }
      ],
      "model": default_model,
      "json": true,
    },
    output: "page_content",
    function: llm
  },
  
  // Step 5: Update last edited timestamp
  {
    input: {},
    output: "last_edited_ts",
    function: () => new Date().toISOString()
  }
];
```

## 3.7 Create Workflow Runner

```typescript
// utils/seo-workflow/run-workflow.ts
import { db } from '@/db';
import { seoPage } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { seo_page_workflow } from './configurations/seo-page-workflow';

interface WorkflowContext {
  [key: string]: any;
}

async function executeWorkflowStep(step: WorkflowStep, context: WorkflowContext) {
  // Prepare input for the step
  const input = Object.entries(step.input).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && value.type === 'db_field') {
      acc[key] = context[value.field];
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  // Execute the step function
  const result = await step.function(input);

  // Update context with result
  context[step.output] = result;

  return context;
}

export async function runWorkflow(pageId: number) {
  try {
    // Get initial page data
    const page = await db.query.seoPage.findFirst({
      where: eq(seoPage.id, pageId)
    });

    if (!page) {
      throw new Error(`Page ${pageId} not found`);
    }

    // Initialize workflow context
    let context: WorkflowContext = { ...page };

    // Execute each step in sequence
    for (const step of seo_page_workflow) {
      console.log(`Executing step: ${step.output}`);
      context = await executeWorkflowStep(step, context);
    }

    // Update database with results
    const { id, createdAt, ...updateData } = context;
    await db
      .update(seoPage)
      .set(updateData)
      .where(eq(seoPage.id, pageId));

    return context;
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

// CLI runner
if (require.main === module) {
  const pageId = parseInt(process.argv[2]);
  if (isNaN(pageId)) {
    console.error('Usage: yarn workflow <page-id>');
    process.exit(1);
  }

  runWorkflow(pageId)
    .then(() => {
      console.log('Workflow completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Workflow failed:', error);
      process.exit(1);
    });
}
```

## 3.8 Running the Workflow

1. Add script to package.json:
```json
{
  "scripts": {
    "workflow": "tsx utils/seo-workflow/run-workflow.ts"
  }
}
```

2. Create a new page:
```sql
INSERT INTO seo_page (keyword, volume) 
VALUES ('case study writing service', 1200)
RETURNING id;
```

3. Run the workflow:
```bash
yarn workflow 1  # Replace 1 with the actual page ID
```

The workflow will:
1. Generate a SEO-friendly slug
2. Perform competitive analysis via Google Search
3. Generate form configuration
4. Generate page content
5. Update the database

The page will then be accessible at `/seo/case-study-writing-service` (or whatever slug was generated). 
