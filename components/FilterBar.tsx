'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type FilterSpec = {
  key: string
  label: string
  options: string[]
}

export default function FilterBar({
  filters,
  labels = { filter: 'Filter', clear: 'Clear' },
}: {
  filters: FilterSpec[]
  labels?: { filter: string; clear: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const active = filters.filter((f) => params.get(f.key)).length

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="filterbar">
      <span className="label filterbar__label">
        {labels.filter}
        {active ? ` · ${active}` : ''}
      </span>
      <div className="filterbar__controls">
        {filters.map((filter) => (
          <label className="filterbar__field" key={filter.key}>
            <span className="sr-only">{filter.label}</span>
            <select value={params.get(filter.key) || ''} onChange={(e) => update(filter.key, e.target.value)}>
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
        {active ? (
          <button className="filterbar__clear" type="button" onClick={() => router.push(pathname, { scroll: false })}>
            {labels.clear}
          </button>
        ) : null}
      </div>
    </div>
  )
}
