import { notFound } from 'next/navigation'
import PageEditor from '@/components/admin/PageEditor'
import { listBlocks, listPages } from '@/lib/kernel/content'
import { blockCatalog } from '@/lib/kernel/render'

export const dynamic = 'force-dynamic'

export default async function AdminPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pages = await listPages()
  const page = pages.find((item) => item.id === Number(id))
  if (!page) notFound()

  const [blocks, catalog] = await Promise.all([listBlocks(page.id), Promise.resolve(blockCatalog())])

  return (
    <PageEditor
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        seo_title: page.seo_title,
        seo_description: page.seo_description,
        status: page.status,
        show_in_nav: page.show_in_nav,
        nav_label: page.nav_label,
        nav_order: page.nav_order,
      }}
      initialBlocks={blocks}
      catalog={catalog}
    />
  )
}
