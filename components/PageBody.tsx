import { notFound } from 'next/navigation'
import { getPage, getSettings } from '@/lib/kernel/content'
import { getDict } from '@/lib/kernel/i18n'
import { renderPage } from '@/lib/kernel/render'

/** Renders a page from the database by slug, through the kernel render loop. */
export default async function PageBody({
  slug,
  locale = 'en',
  search = {},
}: {
  slug: string
  locale?: string
  search?: Record<string, string>
}) {
  const result = await renderPage(slug, search, locale)
  if (!result) notFound()
  return <main id="main">{result.content}</main>
}

export async function pageMetadata(slug: string, locale: string, fallbackTitle: string) {
  const [page, settings, dict] = await Promise.all([getPage(slug), getSettings(), getDict(locale)])
  if (!page) return { title: fallbackTitle }
  return {
    title: dict.c(`page.${page.id}.title`) || page.seo_title || page.title || fallbackTitle,
    description: dict.c(`page.${page.id}.seo_description`) || page.seo_description || settings.seo.default_description,
  }
}
