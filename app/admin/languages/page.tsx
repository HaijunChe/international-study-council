import TranslationsEditor, { type TranslationRow } from '@/components/admin/TranslationsEditor'
import { getTranslations, translationCoverage, translatableContent } from '@/lib/kernel/content'
import { DICTIONARY, DICTIONARY_KEYS, LOCALES } from '@/lib/kernel/dictionary'

export const dynamic = 'force-dynamic'

/** UI keys are grouped by their prefix so the list stays navigable. */
const GROUP_LABEL: Record<string, string> = {
  nav: 'Navigation',
  cta: 'Buttons',
  common: 'Labels and fields',
  form: 'Form messages',
  map: 'World map',
  detail: 'Detail pages',
  footer: 'Footer',
  notFound: 'Not found page',
  lang: 'Language switcher',
  contact: 'Contact details',
}

export default async function AdminLanguages({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const params = await searchParams
  const enabled = LOCALES
  const current = enabled.some((item) => item.code === params.locale) ? String(params.locale) : 'bn'

  const [coverage, content, values] = await Promise.all([
    translationCoverage(),
    translatableContent(),
    getTranslations(current),
  ])

  const uiRows: TranslationRow[] = DICTIONARY_KEYS.map((key) => ({
    key,
    source: DICTIONARY.en[key],
    group: GROUP_LABEL[key.split('.')[0]] || 'Other',
  }))

  const contentRows: TranslationRow[] = content.map((row) => ({
    key: row.key,
    source: row.source,
    group: row.group,
  }))

  return (
    <TranslationsEditor
      locales={enabled.map((item) => ({
        code: item.code,
        label: item.label,
        english: item.english,
        flag: item.flag,
      }))}
      current={current}
      coverage={coverage}
      uiRows={uiRows}
      contentRows={contentRows}
      values={values}
    />
  )
}
