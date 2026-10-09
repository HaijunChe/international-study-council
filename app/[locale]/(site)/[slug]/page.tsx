import PageBody, { pageMetadata } from '@/components/PageBody'

export const dynamic = 'force-dynamic'

/**
 * Catch-all for pages created in the admin that do not have a dedicated route.
 * Create a page, publish it, and this route serves it.
 */
export default async function GenericPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const { locale, slug } = await params
  const raw = (await searchParams) || {}
  const search = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]),
  )
  return <PageBody slug={slug} locale={locale} search={search} />
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  return pageMetadata(slug, locale, 'Not found')
}
