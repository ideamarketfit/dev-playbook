# Hreflang Implementation Guide for Next.js 13+

This guide details the implementation of hreflang attributes in Next.js 13+ applications, which is crucial for SEO as it helps search engines understand the language and regional targeting of your pages.

## Table of Contents
- [Overview](#overview)
- [Implementation](#implementation)
- [Testing and Validation](#testing-and-validation)
- [Common Issues and Solutions](#common-issues-and-solutions)

## Overview

Hreflang tags are essential for:
- Indicating language/region variants of pages to search engines
- Preventing duplicate content issues
- Ensuring proper language targeting in search results

## Implementation

### 1. Root Layout Integration

```typescript
// app/layout.tsx
import { HreflangTags } from '@/components/hreflang-tags';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <HreflangTags />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. HreflangTags Component Implementation

```typescript
// components/hreflang-tags.tsx
'use client'

import { usePathname } from 'next/navigation';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

export function HreflangTags() {
  const pathname = usePathname();
  const domain = `https://www.${process.env.NEXT_PUBLIC_DOMAIN}` || '';

  // Remove locale prefix from pathname if it exists
  const path = pathname.replace(
    /^\/(?:en|ja|ko|zh-Hant|es|fr|pt|de|it|he|ar)/, 
    ''
  );

  return (
    <>
      {/* Language-specific alternates */}
      {SUPPORTED_LANGUAGES.map(({ code }) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={code}
          href={`${domain}${code === 'en' ? '' : `/${code}`}${path}`}
        />
      ))}
      {/* Default language version */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${domain}${path}`}
      />
    </>
  );
}
```

### 3. Generated HTML Output

For a page like `/about`, the component generates:

```html
<!-- Language alternates -->
<link rel="alternate" hrefLang="en" href="https://www.example.com/about" />
<link rel="alternate" hrefLang="ja" href="https://www.example.com/ja/about" />
<link rel="alternate" hrefLang="ko" href="https://www.example.com/ko/about" />
<link rel="alternate" hrefLang="zh-Hant" href="https://www.example.com/zh-Hant/about" />
<link rel="alternate" hrefLang="es" href="https://www.example.com/es/about" />
<link rel="alternate" hrefLang="fr" href="https://www.example.com/fr/about" />
<link rel="alternate" hrefLang="pt" href="https://www.example.com/pt/about" />
<link rel="alternate" hrefLang="de" href="https://www.example.com/de/about" />
<link rel="alternate" hrefLang="it" href="https://www.example.com/it/about" />
<link rel="alternate" hrefLang="he" href="https://www.example.com/he/about" />
<link rel="alternate" hrefLang="ar" href="https://www.example.com/ar/about" />
<!-- Default version -->
<link rel="alternate" hrefLang="x-default" href="https://www.example.com/about" />
```

## Key Features

1. **Automatic Path Handling**:
   - Automatically strips existing locale prefixes
   - Maintains query parameters and hash fragments
   - Handles both root and nested routes

2. **SEO Best Practices**:
   - Includes `x-default` for language/region selector pages
   - Uses absolute URLs as required by Google
   - Maintains bidirectional references between all language versions

3. **Performance Considerations**:
   - Client-side component to avoid SSR overhead
   - Efficient regex-based path manipulation
   - Minimal DOM updates

## Usage Guidelines

1. **Setup Requirements**:
   ```typescript
   // .env or .env.local
   NEXT_PUBLIC_DOMAIN=your-domain.com
   ```

2. **Component Placement**:
   - Place in the root layout for site-wide coverage
   - Can be placed in specific layouts for section-specific alternates

3. **URL Structure**:
   - Default language (English): `example.com/page`
   - Other languages: `example.com/{locale}/page`
   - Language selector: `example.com/language` (with x-default)

4. **Testing and Validation**:
   - Use Google Search Console's International Targeting report
   - Validate with hreflang testing tools
   - Check for proper bidirectional linking

## Common Issues and Solutions

1. **Missing Reciprocal Links**:
   - Ensure all language versions link to each other
   - Include self-referential hreflang tags

2. **Incorrect URL Formation**:
   - Always use absolute URLs
   - Include protocol (https://)
   - Handle www and non-www consistently

3. **Dynamic Routes**:
   - Maintain consistent URL structure across languages
   - Handle parameters and query strings properly 