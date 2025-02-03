# SEO Workflow Project Requirements

## Core Dependencies
Based on the actual `package.json` and workflow files:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.35.0",
    "@supabase/supabase-js": "^2.47.10",
    "ai": "^4.1.0",
    "axios": "^1.7.9",
    "cheerio": "^1.0.0",
    "typescript": "^5.7.3",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "tsx": "^4.19.2"
  }
}
```

## Project Structure
Based on the actual workflow implementation:

```
├── utils/
│   └── seo-workflow/
│       ├── configurations/
│       │   ├── tool-page-seo-workflow.ts
│       │   └── template-page-seo-workflow.ts
│       ├── prompts/
│       │   ├── tool-page-prompt.ts
│       │   └── translate-json-prompt.ts
│       ├── common-function.ts
│       └── run-workflow.ts
```

## Core Components

### Workflow Runner (`run-workflow.ts`)
- Command-line interface for executing SEO workflows
- Supports single ID or range of IDs processing
- Error handling and progress logging
- Usage: `yarn workflow <workflow-type> <rowId or startId-endId>`
- Example: `yarn workflow tool-page 1` or `yarn workflow tool-page 1-20`

### Common Functions (`common-function.ts`)
1. **Core Utilities**:
   - `toSlug`: URL-friendly slug generation
   - `llm`: Anthropic Claude API integration
   - `googleSearch`: Google Custom Search integration with web crawling
   - `executeWorkflow`: Sequential workflow execution engine

2. **Type Definitions**:
   ```typescript
   type WorkflowStep = 
     | SlugWorkflowStep 
     | LlmWorkflowStep 
     | TimestampWorkflowStep 
     | GoogleSearchWorkflowStep
   ```

### Tool Page Workflow (`tool-page-seo-workflow.ts`)
Sequential workflow steps:
1. Generate URL slug from keyword
2. Perform Google search for the keyword
3. Generate English content using Claude
4. Translate to multiple languages:
   - Japanese (ja)
   - Traditional Chinese (zh-Hant)
   - Korean (ko)
   - Spanish (es)
   - French (fr)
   - Portuguese (pt)
   - German (de)
   - Italian (it)
   - Hebrew (he)
   - Arabic (ar)
5. Update last edited timestamp

## Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AI Model
NEXT_PUBLIC_SEO_MODEL=claude-3-sonnet-20240229
ANTHROPIC_API_KEY=

# Google Search
GOOGLE_SEARCH_KEY=
GOOGLE_SEARCH_ID=
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.example` to `.env.local`
- Fill in required API keys and configuration

3. Run workflow:
```bash
# Process single page
yarn workflow tool-page 1

# Process multiple pages
yarn workflow tool-page 1-20
```

## Technical Details

### Google Search Integration
- Uses Google Custom Search API
- Includes web crawling with Cheerio
- 15-second timeout for searches and crawls
- Results limited to 5 pages by default
- Content cleaning and HTML structure preservation

### LLM Integration
- Uses Anthropic's Claude 3 Sonnet model
- Supports both text and JSON outputs
- XML-style field wrapping for context
- 4096 token limit per request
- Temperature: 0 for JSON, 0.7 for text

### Error Handling
- Graceful error handling for API failures
- Continues processing remaining items on error
- Detailed error logging
- 1-second delay between multiple row processing

### Database Integration
- Supabase database integration
- JSONB storage for multilingual content
- Automatic timestamp management
- Transaction-safe updates 
