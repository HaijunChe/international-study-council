import { notFound } from 'next/navigation'
import EntryForm from '@/components/admin/EntryForm'
import { getEntry } from '@/lib/kernel/content'
import { getCollection } from '@/lib/kernel/types'
import '@/lib/kernel/collections'

export const dynamic = 'force-dynamic'

export default async function CollectionEntry({
  params,
}: {
  params: Promise<{ collection: string; id: string }>
}) {
  const { collection: name, id } = await params
  const def = getCollection(name)
  if (!def) notFound()

  const isNew = id === 'new'
  const entry = isNew ? null : await getEntry(name, id)
  if (!isNew && !entry) notFound()

  return (
    <EntryForm
      collection={name}
      singular={def.singular}
      hint={def.hint}
      entryId={entry?.id}
      initial={entry?.data ?? def.initial()}
      fields={def.fields}
      publicUrl={entry?.slug && def.publicPath ? def.publicPath(entry.slug) : undefined}
    />
  )
}
