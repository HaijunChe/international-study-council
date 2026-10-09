import LeadsTable from '@/components/admin/LeadsTable'
import { listLeads } from '@/lib/kernel/content'

export const dynamic = 'force-dynamic'

export default async function AdminLeads() {
  const leads = await listLeads()
  return <LeadsTable initial={leads} />
}
