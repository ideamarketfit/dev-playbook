import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const defaultLocale = 'en'
const locales = ['en', 'zh-Hant', 'ja', 'ko', 'es', 'fr', 'pt', 'de', 'it', 'he', 'ar']

// Paths that should not be processed for localization
const excludedPaths = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/blog',
  '/terms',
  '/privacy',
  '/chat/agents',
]

function getLocale(request: NextRequest) {
  // Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const parsed = acceptLanguage.split(',').map(l => l.split(';')[0])
    const match = parsed.find(l => locales.includes(l))
    if (match) return match
  }
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Skip assets, API routes, and excluded paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    excludedPaths.includes(pathname) ||
    excludedPaths.some(p => pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next()
  }
  // Check if URL is already localized
  const hasLocale = locales.some(
    l => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  const referer = request.headers.get('referer')
  const fromLocalized = referer && locales.some(l => referer.includes(`/${l}/`))
  if (hasLocale || !fromLocalized) {
    return NextResponse.next()
  }
  // Redirect to locale-prefixed path
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  const response = NextResponse.redirect(request.nextUrl)
  response.cookies.set('NEXT_LOCALE', locale)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 