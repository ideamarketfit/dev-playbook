# Plausible Analytics Implementation Guide

This guide explains how to implement Plausible Analytics in our Next.js application for privacy-friendly website analytics.

## Overview

[Plausible](https://plausible.io) is a lightweight, open-source, and privacy-friendly alternative to Google Analytics. It doesn't use cookies and is fully compliant with GDPR, CCPA, and PECR. We use a self-hosted instance at `plausible.ideamarketfit.com`.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install next-plausible
```

### 2. Create Plausible Component

Create a client-side component to handle Plausible Analytics:

```typescript
// components/plausible-analytics.tsx
'use client';

import { useEffect, useState } from 'react';
import PlausibleProvider from 'next-plausible';

export function PlausibleAnalytics() {
  const [browserLanguage, setBrowserLanguage] = useState('en-US');

  useEffect(() => {
    setBrowserLanguage(navigator.language);
  }, []);

  return (
    <PlausibleProvider 
      domain="your-domain.com"
      customDomain="https://plausible.ideamarketfit.com"
      trackOutboundLinks={true}
      trackFileDownloads={true}
      taggedEvents={true}
      pageviewProps={{
        browserLanguage,
      }}
      selfHosted={true}
    />
  );
}
```

### 3. Domain Configuration

The `domain` property in the PlausibleProvider should be set to match your project's domain. This is crucial for proper analytics tracking. For example:
- Production domain: `your-domain.com`
- Development domain: `dev.your-domain.com` or `localhost:3000`

Make sure to update this value according to your project's actual domain.

### 4. Add to Root Layout

Add the PlausibleAnalytics component to your root layout in the head section:

```typescript
// app/layout.tsx
import { PlausibleAnalytics } from '@/components/plausible-analytics';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PlausibleAnalytics />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Features Enabled

Our implementation includes:

1. **Automatic Page Views**: Tracks page views across the application
2. **Outbound Link Tracking**: Automatically tracks clicks on external links
3. **File Download Tracking**: Monitors file download events
4. **Browser Language**: Captures user's browser language for analytics
5. **Self-hosted Instance**: Uses our custom domain for enhanced privacy
6. **Tagged Events**: Enables custom event tracking with properties

## Custom Event Tracking

To track custom events in your components:

```typescript
import { usePlausible } from 'next-plausible'

export function YourComponent() {
  const plausible = usePlausible()

  const handleAction = () => {
    plausible('customEvent', {
      props: {
        property: 'value'
      }
    })
  }
}
```

## Configuration Details

Our Plausible setup uses the following configuration:

- **Domain**: chatdiagram.com
- **Custom Domain**: https://plausible.ideamarketfit.com
- **Self-hosted**: Yes
  - **Tracking Features**:
    - Outbound Links: Enabled
    - File Downloads: Enabled
    - Tagged Events: Enabled
    - Browser Language: Tracked

## Best Practices

1. Always use the client-side component to ensure proper browser API access
2. Include browser language tracking for better user analytics
3. Keep the PlausibleProvider in the head section of the root layout
4. Use tagged events for custom tracking needs

## Troubleshooting

Common issues and solutions:

1. **Events Not Tracking:**
   - Verify the domain configuration matches exactly
   - Check if the PlausibleProvider is mounted correctly
   - Ensure you're using the client-side component

2. **Custom Events Issues:**
   - Import and use the `usePlausible` hook correctly
   - Verify the event name and properties format

## Resources

- [next-plausible Documentation](https://github.com/4lejandrito/next-plausible)
- [Plausible Documentation](https://plausible.io/docs)
- [Next.js Documentation](https://nextjs.org/docs) 