import PageBody, { pageMetadata } from '@/components/PageBody'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return pageMetadata('contact', locale, 'Contact')
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const { locale } = await params
  const raw = (await searchParams) || {}
  const search = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]),
  )
  return <PageBody slug="contact" locale={locale} search={search} />
}
