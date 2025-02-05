// Collection Page Implementation Example
// This is a Server Component that implements a SEO-friendly collection page with i18n support
// Path: app/[locale]/collection/page.tsx

import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from 'next/navigation';
import { Metadata } from "next";

// UI Components
import { Header } from "@/components/landing/scroll-animated-header";
import { Footer } from "@/components/landing/footer";
import { MagicCard } from "@/components/magicui/magic-card";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import AnimatedShinyText from "@/components/magicui/animated-shiny-text";

// Pagination Components
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Utilities
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/lib/utils";
import { isValidLanguage, getSupportedLanguageCodes } from '@/lib/languages';
import { getTranslations } from '@/lib/i18n';

// Type Definitions
interface CollectionItem {
  id: string;
  slug: string;
  keyword: string;
  volume: number;
  created_at: string;
  localizedContent?: {
    hero: {
      title: string;
      description: string;
    };
    meta: {
      title: string;
      description: string;
    };
  };
}

interface PageProps {
  params: {
    locale: string;
  };
  searchParams: { 
    page?: string;
  };
}

// Static Generation Configuration
// This generates pages for all supported languages at build time
export async function generateStaticParams() {
  return getSupportedLanguageCodes().map(locale => ({ locale }));
}

// Dynamic Metadata Generation
// This generates SEO metadata for each language version
export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const { t } = await getTranslations(locale);
  
  return {
    title: t('collection.meta.title'),
    description: t('collection.meta.description'),
    openGraph: {
      title: t('collection.meta.title'),
      description: t('collection.meta.description'),
    },
  };
}

// Data Fetching Function
async function getCollectionItems(page: number = 1, perPage: number = 30, locale: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const start = (page - 1) * perPage;
  const end = start + perPage - 1;

  // Fetch data from Supabase with pagination and localization
  const { data, count } = await supabase
    .from("collection_items")
    .select(`
      id,
      slug,
      keyword,
      volume,
      created_at,
      ${locale}
    `, { count: "exact" })
    .not('slug', 'is', null)
    .range(start, end)
    .order('volume', { ascending: false });

  // Transform and normalize the data
  const items = (data || []).map(item => ({
    id: item.id,
    slug: item.slug,
    keyword: item.keyword,
    volume: item.volume,
    created_at: item.created_at,
    localizedContent: item[locale] ? {
      hero: {
        title: item[locale].hero?.title || item.keyword,
        description: item[locale].hero?.description || ''
      },
      meta: {
        title: item[locale].meta?.title || item.keyword,
        description: item[locale].meta?.description || ''
      }
    } : undefined
  }));

  return {
    items,
    totalPages: Math.ceil((count || 0) / perPage),
    currentPage: page,
  };
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-xl bg-muted"
        />
      ))}
    </div>
  );
}

// Collection Grid Component
function CollectionGrid({ items, locale }: { items: CollectionItem[], locale: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link key={item.id} href={`/${locale}/item/${item.slug}`}>
          <MagicCard 
            className="h-full p-6 transition-all hover:scale-[1.01]"
            gradientColor="hsl(var(--primary))"
            gradientOpacity={0.15}
            gradientFrom="hsl(var(--primary))"
            gradientTo="hsl(var(--primary) / 0.2)"
          >
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold capitalize">
                  {item.localizedContent?.hero?.title || item.keyword}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.localizedContent?.hero?.description || item.keyword}
                </p>
                {item.volume > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Monthly searches: {item.volume.toLocaleString()}
                  </p>
                )}
              </div>
              <Button variant="secondary" className="w-full">
                View Details
              </Button>
            </div>
          </MagicCard>
        </Link>
      ))}
    </div>
  );
}

// Main Page Component
export default async function CollectionPage({ params: { locale }, searchParams }: PageProps) {
  // Validate locale and redirect to 404 if invalid
  if (!isValidLanguage(locale)) {
    notFound();
  }

  // Initialize translations and fetch data
  const { t } = await getTranslations(locale);
  const currentPage = Number(searchParams.page) || 1;
  const { items, totalPages } = await getCollectionItems(currentPage, 30, locale);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header content={t('home.navigation', { returnObjects: true })}>
        <div className="space-y-8 md:space-y-24 pb-8">
          {/* Hero Section */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div className="text-center mt-16 mb-24">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                  {t('collection.hero.title')}
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  {t('collection.hero.description')}
                </p>
                <div className="mt-8 mb-16 flex flex-col items-center justify-center gap-4">
                  <Link 
                    href={t('collection.hero.cta.link')}
                    className={cn(
                      "group rounded-full border border-black/5 bg-primary/5 text-base transition-all ease-in hover:bg-primary/10 dark:border-white/5 dark:bg-primary/10 dark:hover:bg-primary/20",
                    )}
                  >
                    <AnimatedShinyText className="inline-flex items-center justify-center px-6 py-2">
                      <span>{t('collection.hero.cta.text')}</span>
                      <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                    </AnimatedShinyText>
                  </Link>
                </div>
              </div>

              {/* Collection Grid with Suspense */}
              <div id="collection" className="mt-64 md:mt-32">
                <Suspense fallback={<LoadingSkeleton />}>
                  <CollectionGrid items={items} locale={locale} />
                </Suspense>

                {/* Pagination */}
                <Pagination className="mt-12">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          href={`/${locale}/collection?page=${currentPage - 1}`}
                        />
                      </PaginationItem>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href={`/${locale}/collection?page=${page}`}
                                isActive={page === currentPage}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                    )}

                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext 
                          href={`/${locale}/collection?page=${currentPage + 1}`} 
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-32">
            <Footer />
          </div>
        </div>
      </Header>
    </div>
  );
} 