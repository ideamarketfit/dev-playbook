import React from 'react'

export interface SEOHeadProps {
  title: string
  description: string
  openGraph?: {
    title: string
    description: string
    type?: string
  }
}

export function SEOHead({ title, description, openGraph }: SEOHeadProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {openGraph && (
        <>
          <meta property="og:title" content={openGraph.title} />
          <meta property="og:description" content={openGraph.description} />
          {openGraph.type && <meta property="og:type" content={openGraph.type} />}
        </>
      )}
    </>
  )
} 