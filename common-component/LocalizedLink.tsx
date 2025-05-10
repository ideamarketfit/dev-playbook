import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { defaultLocale, locales } from './i18n'
import React from 'react'

interface LocalizedLinkProps extends Omit<LinkProps, 'href'> {
  href: string
  children: React.ReactNode
}

export function LocalizedLink({ href, children, ...props }: LocalizedLinkProps) {
  const pathname = usePathname() || ''
  const segments = pathname.split('/')
  const currentLocale = locales.includes(segments[1]) ? segments[1] : defaultLocale
  const localePrefixedHref = `/${currentLocale}${href.startsWith('/') ? '' : '/'}${href}`

  return (
    <Link href={localePrefixedHref} {...props}>
      {children}
    </Link>
  )
} 