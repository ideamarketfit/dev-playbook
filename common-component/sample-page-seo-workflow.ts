import { toSlug, llm, googleSearch, concatenateFields, type WorkflowStep, type ParallelledExecutionStep } from './workflow-utils';
import { createServicePageContentPrompt } from '../seo-workflow/prompts/service-page-content-prompt';
import { createServiceFormPrompt } from '../seo-workflow/prompts/service-form-prompt';

/**
 * Sample page generation workflow.
 * Demonstrates how to populate: slug, page_content, form_config, en, and other locales.
 */
const translateTo = (lang: string): WorkflowStep => ({
  type: 'llm' as const,
  name: `Translate to ${lang}`,
  input: {
    system_msg: `Translate the JSON content in <en> into ${lang}, preserving structure.`,  
    user_msg: [{ type: 'db_field' as const, field: 'en' }],
    model: process.env.NEXT_PUBLIC_TRANSLATION_MODEL!,
    json: true,
  },
  output: lang,
  function: llm,
});

export const sample_page_workflow: WorkflowStep[] = [
  // 1. Normalize the slug from keyword
  {
    type: 'slug' as const,
    input: { keyword: { type: 'db_field' as const, field: 'keyword' } },
    output: 'slug',
    function: toSlug,
  },

  // 2. Generate main page content via LLM
  {
    type: 'llm' as const,
    name: 'Generate Page Content',
    input: {
      system_msg: createServicePageContentPrompt(),
      user_msg: [
        { type: 'db_field' as const, field: 'keyword' },
        { type: 'db_field' as const, field: 'context' },
      ],
      model: process.env.NEXT_PUBLIC_SEO_MODEL!,
      json: true,
    },
    output: 'page_content',
    function: llm,
  },

  // 3. Generate optional form config via LLM
  {
    type: 'llm' as const,
    name: 'Generate Form Config',
    input: {
      system_msg: createServiceFormPrompt(),
      user_msg: [
        { type: 'db_field' as const, field: 'keyword' },
        { type: 'db_field' as const, field: 'context' },
        { type: 'db_field' as const, field: 'page_content' },
      ],
      model: process.env.NEXT_PUBLIC_SEO_MODEL!,
      json: true,
    },
    output: 'form_config',
    function: llm,
  },

  // 4. Merge form_config and page_content into the `en` JSONB column
  {
    type: 'concatenate_fields' as const,
    input: {
      fields: [
        { type: 'db_field' as const, field: 'form_config' },
        { type: 'db_field' as const, field: 'page_content' },
      ],
    },
    output: 'en',
    function: concatenateFields,
  },

  // 5. Translate `en` into additional locales in parallel
  {
    type: 'parallel' as const,
    name: 'Generate Translations',
    steps: [
      translateTo('ja'),
      translateTo('es'),
      translateTo('fr'),
      translateTo('de'),
      // add more locales as needed
    ],
  },
]; 