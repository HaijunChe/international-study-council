import PageBody from '@/components/PageBody'

export const dynamic = 'force-dynamic'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <PageBody slug="home" locale={locale} />
}
