import { db } from '@/db'
import { servicePage } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'

/**
 * Fetches the content JSON for a given slug and locale, falling back to English.
 */
export async function getPageContent(
  slug: string,
  locale: string = 'en'
): Promise<any | null> {
  const row = await db.query.servicePage.findFirst({
    where: eq(servicePage.slug, slug),
  })
  if (!row) return null
  const localized = (row as any)[locale] as { page_content: any } | undefined
  if (localized?.page_content) {
    return localized.page_content
  }
  // fallback to English
  return (row as any).en.page_content
}

/**
 * Generates Next.js Metadata for a given slug and locale.
 */
export async function getPageMetadata(
  slug: string,
  locale: string = 'en'
): Promise<Metadata> {
  const row = await db.query.servicePage.findFirst({
    where: eq(servicePage.slug, slug),
  })
  if (!row) {
    return { title: 'Not Found', description: 'Page not found.' }
  }
  const localized = (row as any)[locale] as { page_content: any } | undefined
  const content = localized?.page_content || (row as any).en.page_content
  return {
    title: content.meta.title,
    description: content.meta.description,
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      type: 'website',
    },
  }
} 