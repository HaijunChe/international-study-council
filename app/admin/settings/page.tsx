import SettingsForm from '@/components/admin/SettingsForm'
import { getSettings } from '@/lib/kernel/content'

export const dynamic = 'force-dynamic'

export default async function AdminSettings() {
  const settings = await getSettings()
  return <SettingsForm initial={settings} />
}
