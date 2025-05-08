# Home Page Implementation Guide with Magic UI and i18n

A comprehensive guide for implementing a modern home page using Magic UI components and internationalization (i18n) in a Next.js 14+ project.

> **Note:** This implementation uses a middleware-free approach for i18n, relying instead on Next.js App Router's built-in features with dynamic route segments (`[locale]`). This approach reduces complexity and improves performance by avoiding unnecessary middleware processing.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [i18n Implementation](#i18n-implementation)
4. [Content Management](#content-management)
5. [Performance Optimization](#performance-optimization)
6. [Best Practices](#best-practices)
7. [Common Gotchas](#common-gotchas)
8. [Testing](#testing)
9. [Language Switcher](#language-switcher)
10. [Landing Page Implementation](#landing-page-implementation)

## Project Structure

```
├── app/
│   ├── [locale]/
│   │   └── page.tsx           # Localized home page
│   ├── layout.tsx             # Root layout
│   └── page.tsx              # Default home page
├── components/
│   ├── landing/
│   │   ├── scroll-animated-header.tsx
│   │   └── hero-section.tsx
│   └── magicui/
│       └── magic-card.tsx
├── lib/
│   ├── i18n.ts               # i18n configuration
│   └── languages.ts          # Language settings
└── public/
    └── locales/              # Translation files
        ├── en.json
        ├── es.json
        └── ...
```

## Component Architecture

### 1. Core Components

#### Header Component
```typescript
interface NavigationContent {
  links: Array<{
    id: number;
    label: string;
    link: string;
  }>;
  cta: {
    label: string;
    link: string;
  };
}

export function Header({ children, content }: {
  children: React.ReactNode;
  content: NavigationContent;
}) {
  const containerRef = useRef(null);
  return (
    <main ref={containerRef} className="h-screen w-full overflow-y-auto">
      <StickyHeader containerRef={containerRef} content={content} />
      <div className="w-full">{children}</div>
    </main>
  );
}
```

#### Page Implementation
```typescript
// app/[locale]/page.tsx
export default async function LocalizedPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const translations = await getTranslations(locale);
  
  return (
    <Header content={translations.home.navigation}>
      <div className="space-y-8 md:space-y-24 pb-8">
        <Hero content={translations.home.hero} />
        <FeatureSection content={translations.home.features} />
        <HowItWorksSection content={translations.home.howItWorks} />
      </div>
    </Header>
  );
}
```

## i18n Implementation

### 1. Configuration (lib/i18n.ts)
```typescript
interface HomeTranslations {
  meta: {
    title: string;
    description: string;
  };
  navigation: NavigationContent;
  hero: Record<string, string>;
  features: Record<string, unknown>;
}

export function createTranslator(locale: string) {
  // Implementation details
}
```

### 2. Translation Files
```json
{
  "home": {
    "meta": {
      "title": "Your Site Title",
      "description": "Site description"
    },
    "navigation": {
      "links": [
        {
          "id": 1,
          "label": "Features",
          "link": "#features"
        }
      ],
      "cta": {
        "label": "Get Started",
        "link": "/signup"
      }
    }
  }
}
```

## Content Management

### 1. Content Structure
- Organize content by feature sections
- Use TypeScript interfaces for type safety
- Implement content loading strategies

### 2. Content Flow
```typescript
// 1. Load translations
const translations = await getTranslations(locale);

// 2. Pass to components
<Header content={translations.home.navigation}>
  <Hero content={translations.home.hero} />
</Header>
```

## Performance Optimization

### 1. Server Components
- Use React Server Components by default
- Mark client components with "use client"
- Optimize component boundaries

### 2. Animation Optimization
- Use Framer Motion for smooth animations
- Implement proper loading states
- Optimize for mobile devices

### 3. Asset Loading
- Implement lazy loading for images
- Use proper image formats and sizes
- Optimize for Core Web Vitals

## Best Practices

### 1. Code Organization
- Separate concerns between components
- Use TypeScript for type safety
- Implement proper error boundaries

### 2. Performance
- Minimize client-side JavaScript
- Use server components where possible
- Implement proper loading states

### 3. Accessibility
- Use semantic HTML structure
- Implement ARIA labels
- Support keyboard navigation
- Test with screen readers

### 4. Internationalization
- Support RTL languages
- Handle dynamic content length
- Implement proper fallbacks

## Common Gotchas

1. **Translation Loading**
   ```typescript
   // ❌ Don't
   const translations = translations[locale];
   
   // ✅ Do
   const translations = await getTranslations(locale);
   ```

2. **Component Marking**
   ```typescript
   // ❌ Don't
   export default function InteractiveComponent() {
     const [state, setState] = useState();
   }
   
   // ✅ Do
   'use client';
   export default function InteractiveComponent() {
     const [state, setState] = useState();
   }
   ```

3. **Loading States**
   ```typescript
   // ❌ Don't
   if (!data) return null;
   
   // ✅ Do
   if (!data) return <LoadingComponent />;
   ```

## Testing

### 1. Translation Testing
```typescript
import { getTranslations } from '@/lib/i18n';

describe('Home Page Translations', () => {
  it('should load correct translations for locale', async () => {
    const translations = await getTranslations('en');
    expect(translations.home.meta.title).toBeDefined();
  });
});
```

### 2. Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { Header } from './header';

describe('Header Component', () => {
  it('should render navigation items', () => {
    render(<Header content={mockContent} />);
    expect(screen.getByText('Features')).toBeInTheDocument();
  });
});
```

### 3. Integration Testing
- Test component interactions
- Verify animation behaviors
- Test responsive design
- Validate accessibility

This structure ensures a maintainable, performant, and accessible implementation while following Next.js and React best practices. 

## Language Switcher

Use the pre-built `LanguageSwitcher` component from the common-component folder:

```tsx
import { LanguageSwitcher } from '@/common-component/language-switcher'
```

## Landing Page Implementation

Refer to the landing page template at `dev-playbook/seo-page/4-landing-page-template.md` for a full example. 