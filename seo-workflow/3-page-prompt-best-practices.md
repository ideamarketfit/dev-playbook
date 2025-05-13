# 3 - Page Prompt Best Practices

This document summarizes best practices for writing prompts that generate valid `ServicePageContent` JSON.

## 1. Strict JSON-Only Output
- Return **only** a JSON object (no commentary, markdown, or code blocks).
- Start with `{` and end with `}` so the result can be parsed by `JSON.parse()`.

## 2. Field-by-Field Formatting Guidelines
> **Note:** Only the **meta** section below is standardized for all prompts. The remaining fields vary per page type — what follows is an **example** based on the `ServicePageContent` schema; adapt per your own JSON interface.

**meta**  
  - `title`: 50–60 characters, format `"[Service] | [Quality Promise] + [Exact Value]"`  
  - `description`: 140–160 characters, must start with `"🎁 Our AI expert will write your first [service] free!"`

### 2.1 Example: ServicePageContent Fields
_The following sections illustrate how you might define other fields in your JSON schema for a service page. These are examples only and not required for all prompts._

**hero**  
  - `tag`: 2–3 words describing the service type  
  - `title`: `"[Quality] [Exact Deliverable] - [Specific Result]"`  
  - `description`:  
    1. Begin with benefit-driven structure:  
       `"Get [quality service] to **[quantified benefit]**"`  
    2. End with a concise CTA: `"get your first service FREE by filling [simple input] in the form 👉 "`  
    3. Use plain text (no markdown), keep it friendly and impactful.
**service-description**  
  - `title`: `"Here's What You'll Get"`  
  - `description`: multiline string with each line prefixed by `"✓ "` and separated by `\n`; list 3–5 deliverables/benefits.
**workflow**  
  - `title`: `"How I Do It"`  
  - `steps`: array of 4–7 one-line steps, each following  
    `"Our AI expert will [action] using [tools/methods] to ensure [outcome]"`
**final-output**  
  - `title`: `"What You'll Get"`  
  - `components`:  
    - `title`: `"Deliverables"`  
    - `items`: list of file types/formats  
  - `sample`:  
    - `title`: `"Sample Preview"`  
    - `content`: realistic example matching the schema.
**quality-criteria**  
  - `title`: section heading  
  - `criteria`: array of objects with `title` and `items[]` listing specific quality checks/metrics.
**faq**  
  - `title`: section heading  
  - `questions`: array of `{ question, answer }` pairs with precise, numbered answers and timeframes.

## 3. General Content Strategy
- Use the **keyword** and **context** to:  
  - Align with industry best practices and terminology.  
  - Highlight unique selling points and quality standards.  
  - Drive conversions with benefit-focused language.  
- Follow a clear hierarchy:  
  `meta` → `hero` → `service-description` → `workflow` → `final-output` → `quality-criteria` → `faq`
- Maintain consistency across locales by strictly adhering to this schema and style.

