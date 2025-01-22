import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const defaultModel = process.env.NEXT_PUBLIC_SEO_MODEL || 'claude-3-sonnet-20240229';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const anthropicKey = process.env.ANTHROPIC_API_KEY!;

if (!anthropicKey) {
  throw new Error('Missing Anthropic API key');
}

const anthropicClient = new Anthropic({
  apiKey: anthropicKey,
});

/**
 * Converts a string to a URL-friendly slug.
 * Example: "Resume Generator" -> "resume-generator"
 */
export function toSlug(str: string): string {
    return str
      .toLowerCase() // convert to lowercase
      .trim() // remove leading and trailing whitespace
      .replace(/[^\w\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
  }

// Type for JSON validation template
export type JsonTemplate = Record<string, unknown> | unknown[] | string | number | boolean | null;

type SupportedModel = typeof defaultModel;

/**
 * Makes a synchronized LLM call using Vercel AI SDK with Claude
 * @param system_msg The system message string
 * @param user_msgs Array of user messages to process
 * @param model The model to use (defaults to env.NEXT_PUBLIC_SEO_MODEL or claude-3-sonnet-20240229)
 * @param json Whether to parse the response as JSON
 * @returns The LLM's response as a string or parsed JSON object
 */
export async function llm(
  system_msg: string,
  user_msgs: string[],
  model: string = defaultModel,
  json: boolean = false,
  fields: string[] = []
): Promise<string | Record<string, unknown>> {
  try {
    const prompt = user_msgs.map((msg, index) => 
      `<${fields[index]}>${String(msg)}</${fields[index]}>`
    ).join('\n');

    const response = await anthropicClient.messages.create({
      model: model.replace('anthropic:', ''),
      system: system_msg,
      messages: [{ role: 'user', content: prompt }],
      temperature: json ? 0 : 0.7,
      max_tokens: 4096,
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    if (json) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid JSON response from LLM');
      }
    }

    return content;
  } catch (error) {
    console.error('Error in LLM call:', error);
    throw error;
  }
}

export type DbField = { type: 'db_field'; field: string };
export type RowData = Record<string, unknown>;

export interface BaseWorkflowStep {
  output: string;
}

export interface SlugWorkflowStep extends BaseWorkflowStep {
  input: { keyword: DbField };
  function: typeof toSlug;
}

export interface LlmWorkflowStep extends BaseWorkflowStep {
  input: {
    system_msg: string;
    user_msg: DbField[];
    model?: string;
    json?: boolean;
  };
  function: typeof llm;
}

export interface GoogleSearchWorkflowStep extends BaseWorkflowStep {
  input: { keyword: DbField };
  function: typeof googleSearch;
}

export interface TimestampWorkflowStep extends BaseWorkflowStep {
  input: Record<string, never>;
  function: () => string;
}

export type WorkflowStep = SlugWorkflowStep | LlmWorkflowStep | TimestampWorkflowStep | GoogleSearchWorkflowStep;

function isLlmWorkflowStep(step: WorkflowStep): step is LlmWorkflowStep {
  return 'system_msg' in step.input;
}

function isTimestampWorkflowStep(step: WorkflowStep): step is TimestampWorkflowStep {
  return Object.keys(step.input).length === 0;
}

function isGoogleSearchWorkflowStep(step: WorkflowStep): step is GoogleSearchWorkflowStep {
  return 'keyword' in step.input && step.function === googleSearch;
}

/**
 * Executes a workflow of functions sequentially, reading from and writing to Supabase
 * @param table The Supabase table name
 * @param rowId The row ID to process
 * @param workflow Array of workflow steps with input, output, and function definitions
 */
export async function executeWorkflow(
  table: string,
  rowId: number,
  workflow: WorkflowStep[]
) {
  const { data: rowData, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', rowId)
    .single();

  if (fetchError) {
    console.error('Error fetching row:', fetchError);
    throw fetchError;
  }

  if (!rowData) {
    throw new Error('No data found for the specified row');
  }

  const data = rowData as RowData;

  for (const step of workflow) {
    try {
      const result = isLlmWorkflowStep(step)
        ? await step.function(
            step.input.system_msg,
            step.input.user_msg.map(field => {
              const value = data[field.field];
              // If the value is an object, stringify it
              return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            }),
            step.input.model,
            step.input.json,
            step.input.user_msg.map(field => field.field) // Pass field names for XML tags
          )
        : isTimestampWorkflowStep(step)
        ? step.function()
        : isGoogleSearchWorkflowStep(step)
        ? await step.function(data[step.input.keyword.field] as string)
        : step.function(data[step.input.keyword.field] as string);

      const { error: updateError } = await supabase
        .from(table)
        .update({ [step.output]: result })
        .eq('id', rowId);

      if (updateError) {
        throw updateError;
      }

      data[step.output] = result;
    } catch (error) {
      console.error(`Error in workflow step ${step.output}:`, error);
      throw error;
    }
  }

  return data;
}

interface GoogleSearchConfig {
  API_KEY: string;
  SEARCH_ENGINE_ID: string;
  API_HOST: string;
}

interface SearchResult {
  search_results: Array<{
    title: string;
    link: string;
    content?: string; // Crawled content
  }>;
  error?: string;
}

interface GoogleSearchResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
      cse_thumbnail?: Array<{ src: string }>;
    };
  }>;
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    message: string;
  };
}

const GOOGLE_SEARCH_CONFIG: GoogleSearchConfig = {
  API_KEY: process.env.GOOGLE_SEARCH_KEY!,
  SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ID!,
  API_HOST: 'https://www.googleapis.com/customsearch/v1'
};

const TIMEOUT_MS = 15000; // 15 seconds timeout

async function crawlUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      timeout: TIMEOUT_MS,
      maxRedirects: 3
    });
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('nav').remove();
    $('footer').remove();
    $('header').remove();
    $('meta').remove();
    $('link').remove();
    $('img').remove();
    $('svg').remove();
    $('button').remove();
    $('form').remove();
    $('input').remove();
    
    // Clean up the content while preserving structure
    const content = $('body')
      .find('h1, h2, h3, h4, h5, p, span, div')
      .map((_, element) => {
        const $el = $(element);
        // Get the tag name
        const tag = element.tagName.toLowerCase();
        // Clean the text content
        const text = $el.text().replace(/\s+/g, ' ').trim();
        
        // Only include non-empty elements
        if (text) {
          // Format based on tag type
          switch(tag) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
              return `<${tag}>${text}</${tag}>`;
            case 'p':
              return `<p>${text}</p>`;
            case 'span':
            case 'div':
              // Only wrap in tags if it's not just whitespace
              return text;
          }
        }
        return '';
      })
      .get()
      .filter(text => text.length > 0)
      .join('\n')
      .slice(0, 4800); // Increased length limit to accommodate HTML tags
    
    return content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        console.log(`Skipping ${url} due to 403 error`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`Timeout while crawling ${url}`);
      } else {
        console.error(`Error crawling ${url}:`, error.message);
      }
    } else {
      console.error(`Unknown error crawling ${url}:`, error);
    }
    return null;
  }
}

export async function googleSearch(
  query: string,
  limit: number = 5
): Promise<SearchResult> {
  try {
    if (!GOOGLE_SEARCH_CONFIG.API_KEY) {
      throw new Error('GOOGLE_SEARCH_KEY is required');
    }

    if (!GOOGLE_SEARCH_CONFIG.SEARCH_ENGINE_ID) {
      throw new Error('GOOGLE_SEARCH_ID is required');
    }

    const response = await axios.get<GoogleSearchResponse>(GOOGLE_SEARCH_CONFIG.API_HOST, {
      params: {
        key: GOOGLE_SEARCH_CONFIG.API_KEY,
        cx: GOOGLE_SEARCH_CONFIG.SEARCH_ENGINE_ID,
        q: query,
        num: Math.min(limit, 10),
        safe: 'active'
      },
      timeout: TIMEOUT_MS
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    // Use Promise.race with timeouts for each crawl operation
    const results = await Promise.all(
      (response.data.items || [])
        .slice(0, limit)
        .map(async item => {
          try {
            const content = await Promise.race([
              crawlUrl(item.link),
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Crawl timeout')), TIMEOUT_MS)
              )
            ]);
            
            return {
              title: item.title,
              link: item.link,
              content: content || undefined
            };
          } catch (error) {
            console.log(`Skipping ${item.link} due to timeout`);
            return {
              title: item.title,
              link: item.link,
            };
          }
        })
    );

    // Filter out results with no content
    const validResults = results.filter(result => result.content !== undefined);

    return {
      search_results: validResults,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error('Google search timeout');
      return {
        search_results: [],
        error: 'Search timeout'
      };
    }
    console.error('Google search error:', error);
    return {
      search_results: [],
      error: error instanceof Error ? error.message : 'An error occurred during search'
    };
  }
}