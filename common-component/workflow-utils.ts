import { Anthropic } from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { getRow, updateRow, updateRowStatus, type TableName } from '@/utils/seo-workflow/db'

// Default LLM model settings
const defaultModel = process.env.NEXT_PUBLIC_SEO_MODEL || 'claude-3-sonnet-20240229'
const translationModel = process.env.NEXT_PUBLIC_TRANSLATION_MODEL || defaultModel

// API keys
const anthropicKey = process.env.ANTHROPIC_API_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

if (!anthropicKey) throw new Error('Missing ANTHROPIC_API_KEY')
if (!openaiKey) throw new Error('Missing OPENAI_API_KEY')

const anthropicClient = new Anthropic({ apiKey: anthropicKey })
const openaiClient = new OpenAI({ apiKey: openaiKey })

/** Converts text into a URL-friendly slug. */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^ -\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Delay helper */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

/**
 * Wrapper for LLM calls, supports both OpenAI and Anthropic.
 * @param system_msg System prompt
 * @param user_msgs Array of user message strings
 * @param model Model identifier
 * @param json Whether to parse JSON
 * @param fields Optional tags for JSON fields
 */
export async function llm(
  system_msg: string,
  user_msgs: string[],
  model: string = defaultModel,
  json: boolean = false,
  fields: string[] = []
): Promise<string | Record<string, unknown>> {
  const MAX_RETRIES = json ? 3 : 1
  const RETRY_DELAY = 1000

  async function makeRequest(): Promise<string> {
    const prompt = user_msgs.map((msg, i) => `<${fields[i]}>${msg}</${fields[i]}>`).join('\n')
    let content: string
    if (model.startsWith('gpt')) {
      const res = await openaiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system_msg },
          { role: 'user', content: prompt }
        ],
        temperature: json ? 0 : 0.7,
        ...(json ? { response_format: { type: 'json_object' } } : {})
      })
      content = res.choices[0]?.message?.content || ''
    } else {
      const res = await anthropicClient.messages.create({
        model: model.replace('claude-', ''),
        system: system_msg,
        messages: [{ role: 'user', content: prompt }],
        temperature: json ? 0 : 0.7,
        max_tokens: 8192
      })
      content = Array.isArray(res.content) && res.content[0]?.type === 'text'
        ? res.content[0].text
        : ''
    }
    return content
  }

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await makeRequest()
      if (!json) return raw
      try {
        return JSON.parse(raw)
      } catch (parseErr) {
        lastError = parseErr as Error
        if (attempt === MAX_RETRIES) throw lastError
        await delay(RETRY_DELAY)
      }
    } catch (err) {
      lastError = err as Error
      if (attempt === MAX_RETRIES) throw lastError
      await delay(RETRY_DELAY)
    }
  }
  throw lastError!
}

/**
 * Performs a Google Custom Search and optionally crawls content.
 */
export async function googleSearch(
  query: string,
  limit: number = 5
): Promise<any> {
  const API_KEY = process.env.GOOGLE_SEARCH_KEY!
  const CX = process.env.GOOGLE_SEARCH_ID!
  const HOST = 'https://www.googleapis.com/customsearch/v1'
  if (!API_KEY || !CX) throw new Error('Missing Google Search credentials')
  const res = await axios.get(HOST, {
    params: { key: API_KEY, cx: CX, q: query, num: Math.min(limit, 10) }
  })
  const items = res.data.items || []
  // Optional: crawl URLs for page content
  const results = await Promise.all(
    items.slice(0, limit).map(async (it: any) => {
      try {
        const resp = await axios.get(it.link, { timeout: 10000 })
        const $ = cheerio.load(resp.data)
        $('script, style, noscript, nav, footer, header, meta, link, img, svg, button, form, input').remove()
        return { title: it.title, link: it.link, content: $('body').text().trim() }
      } catch {
        return { title: it.title, link: it.link }
      }
    })
  )
  return { search_results: results }
}

/**
 * Combines multiple JSON fields into one object, keyed by field names.
 */
export async function concatenateFields(
  fields: Array<string | Record<string, unknown>>,
  fieldNames: Array<{ field: string }>
): Promise<Record<string, unknown>> {
  const parsed = fields.map(f => typeof f === 'string' ? JSON.parse(f) : f)
  return parsed.reduce((acc, obj, i) => ({ ...acc, [fieldNames[i].field]: obj }), {})
}

/**
 * Types for defining and executing SEO page generation workflows
 */
export type DbField = { type: 'db_field'; field: string };

export type WorkflowStepType =
  | 'slug'
  | 'llm'
  | 'timestamp'
  | 'google_search'
  | 'parallel'
  | 'concatenate_fields';

export interface BaseWorkflowStep {
  type: WorkflowStepType;
  name?: string;
}

export interface ExecutableWorkflowStep extends BaseWorkflowStep {
  output: string;
}

export interface SlugWorkflowStep extends ExecutableWorkflowStep {
  type: 'slug';
  input: { keyword: DbField };
  function: typeof toSlug;
}

export interface LlmWorkflowStep extends ExecutableWorkflowStep {
  type: 'llm';
  input: {
    system_msg: string;
    user_msg: DbField[];
    model?: string;
    json?: boolean;
  };
  function: typeof llm;
}

export interface GoogleSearchWorkflowStep extends ExecutableWorkflowStep {
  type: 'google_search';
  input: { keyword: DbField };
  function: typeof googleSearch;
}

export interface TimestampWorkflowStep extends ExecutableWorkflowStep {
  type: 'timestamp';
  input: Record<string, never>;
  function: () => string;
}

export interface ConcatenateFieldsWorkflowStep extends ExecutableWorkflowStep {
  type: 'concatenate_fields';
  input: { fields: DbField[] };
  function: typeof concatenateFields;
}

export interface ParallelledExecutionStep extends BaseWorkflowStep {
  type: 'parallel';
  steps: Array<
    SlugWorkflowStep |
    LlmWorkflowStep |
    TimestampWorkflowStep |
    GoogleSearchWorkflowStep |
    ConcatenateFieldsWorkflowStep
  >;
}

export type WorkflowStep =
  | SlugWorkflowStep
  | LlmWorkflowStep
  | TimestampWorkflowStep
  | GoogleSearchWorkflowStep
  | ConcatenateFieldsWorkflowStep
  | ParallelledExecutionStep;

// Add missing executor types and functions
export type ExecutableStep =
  | SlugWorkflowStep
  | LlmWorkflowStep
  | TimestampWorkflowStep
  | GoogleSearchWorkflowStep
  | ConcatenateFieldsWorkflowStep;

function isLlmWorkflowStep(step: WorkflowStep): step is LlmWorkflowStep {
  return step.type === 'llm';
}
function isTimestampWorkflowStep(step: WorkflowStep): step is TimestampWorkflowStep {
  return step.type === 'timestamp';
}
function isGoogleSearchWorkflowStep(step: WorkflowStep): step is GoogleSearchWorkflowStep {
  return step.type === 'google_search';
}
function isConcatenateFieldsWorkflowStep(step: WorkflowStep): step is ConcatenateFieldsWorkflowStep {
  return step.type === 'concatenate_fields';
}
function isParallelledExecutionStep(step: WorkflowStep): step is ParallelledExecutionStep {
  return step.type === 'parallel';
}

export async function executeWorkflow(
  table: TableName,
  rowId: number,
  workflow: WorkflowStep[]
) {
  const workflowStartTime = performance.now();
  const rowData = await getRow(table, rowId);
  if (!rowData) throw new Error('No data found for the specified row');
  await updateRowStatus(table, rowId, 'running');
  const data = rowData as RowData;
  try {
    const executeStep = async (step: WorkflowStep) => {
      const startTime = performance.now();
      const stepIdentifier = step.name || step.type;
      if (isParallelledExecutionStep(step)) {
        console.log(`Step [${stepIdentifier}] >>>>>>>> Starting parallel execution of ${step.steps.length} steps...`);
        await Promise.all(step.steps.map(executeStep));
        console.log(`Step [${stepIdentifier}] <<<<<<<< Parallel execution completed`);
        return;
      }
      const executableStep = step as ExecutableStep;
      const result = isLlmWorkflowStep(executableStep)
        ? await executableStep.function(
            executableStep.input.system_msg,
            executableStep.input.user_msg.map(field => {
              const value = data[field.field];
              return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            }),
            executableStep.input.model,
            executableStep.input.json,
            executableStep.input.user_msg.map(field => field.field)
          )
        : isTimestampWorkflowStep(executableStep)
        ? executableStep.function()
        : isGoogleSearchWorkflowStep(executableStep)
        ? await executableStep.function(data[executableStep.input.keyword.field] as string)
        : isConcatenateFieldsWorkflowStep(executableStep)
        ? await executableStep.function(
            executableStep.input.fields.map(field => data[field.field] as string | Record<string, unknown>),
            executableStep.input.fields
          )
        : executableStep.function(data[executableStep.input.keyword.field] as string);
      await updateRow(table, rowId, { [executableStep.output]: result });
      data[executableStep.output] = result;
      const endTime = performance.now();
      console.log(`Step [${stepIdentifier}] completed in ${((endTime - startTime)/1000).toFixed(2)}s`);
      return result;
    };
    for (const step of workflow) await executeStep(step);
    console.log(`Total workflow execution time: ${((performance.now() - workflowStartTime)/1000).toFixed(2)}s`);
    await updateRowStatus(table, rowId, 'success');
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error
      ? `${error.message} in ${error.stack?.split('\n')[1] || 'unknown location'}`
      : 'Unknown error during workflow execution';
    console.error('Workflow execution error:', errorMessage);
    await updateRowStatus(table, rowId, 'failed', errorMessage).catch(err => console.error('Failed to update error status:', err));
    throw error;
  }
}

interface GoogleSearchConfig {
  API_KEY: string;
  SEARCH_ENGINE_ID: string;
  API_HOST: string;
}
interface SearchResult {
  search_results: Array<{ title: string; link: string; content?: string }>;
  error?: string;
}
interface GoogleSearchResponse {
  items?: Array<{ title: string; link: string; snippet: string; pagemap?: { cse_thumbnail?: Array<{ src: string }> } }>;
  searchInformation?: { totalResults: string; searchTime: number };
  error?: { message: string };
}
const TIMEOUT_MS = 15000;
async function crawlUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const $ = cheerio.load(response.data);
    $('script, style, noscript, nav, footer, header, meta, link, img, svg, button, form, input').remove();
    const content = $('body')
      .find('h1, h2, h3, h4, h5, p, span, div')
      .map((_, el) => {
        const $el = $(el);
        const tag = el.tagName.toLowerCase();
        const text = $el.text().replace(/\s+/g, ' ').trim();
        if (!text) return '';
        switch(tag) {
          case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': return `<${tag}>${text}</${tag}>`;
          case 'p': return `<p>${text}</p>`;
          default: return text;
        }
      })
      .get()
      .filter(Boolean)
      .join('\n')
      .slice(0, 4800);
    return content;
  } catch {
    return null;
  }
}

export async function googleSearch(
  query: string,
  limit: number = 5
): Promise<SearchResult> {
  const API_KEY = process.env.GOOGLE_SEARCH_KEY!;
  const CX = process.env.GOOGLE_SEARCH_ID!;
  const HOST = 'https://www.googleapis.com/customsearch/v1';
  if (!API_KEY || !CX) throw new Error('Missing Google Search credentials');
  const response = await axios.get<GoogleSearchResponse>(HOST, {
    params: { key: API_KEY, cx: CX, q: query, num: Math.min(limit, 10) },
    timeout: TIMEOUT_MS
  });
  if (response.data.error) throw new Error(response.data.error.message);
  const items = response.data.items || [];
  const results = await Promise.all(
    items.slice(0, limit).map(async item => {
      try {
        return { title: item.title, link: item.link, content: await crawlUrl(item.link) };
      } catch { return { title: item.title, link: item.link } }
    })
  );
  return { search_results: results };
}

export type RowData = Record<string, unknown>; 