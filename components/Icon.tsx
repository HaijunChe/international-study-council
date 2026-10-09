/**
 * Line icons — 1.4px stroke, 24px box, no fills. Deliberately geometric so they
 * sit next to the serif display type without competing with it.
 */

export type IconName =
  | 'compass'
  | 'route'
  | 'document'
  | 'cv'
  | 'briefcase'
  | 'send'
  | 'coin'
  | 'language'
  | 'passport'
  | 'plane'
  | 'check'
  | 'globe'
  | 'shield'
  | 'clock'
  | 'search'
  | 'cross'

const PATHS: Record<IconName, string> = {
  // Getting started
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2.1 5-5 2.1 2.1-5 5-2.1Z',
  route: 'M6 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.5 16.5h4a3.5 3.5 0 0 0 3.5-3.5v-3',
  // Documents
  document: 'M6 3h7l5 5v13H6V3Zm7 0v5h5M9 13h6M9 17h6',
  cv: 'M5 4h14v16H5V4Zm4.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 15c0-1.4 1.1-2.5 2.5-2.5S13 13.6 13 15M15.5 9h2M15.5 12h2M8 18h8',
  briefcase: 'M4 8h16v11H4V8Zm5-3h6v3H9V5Zm-5 6.5h16',
  send: 'M4 12 20 4l-4 16-4.5-6.5L4 12Z',
  // Funding
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v10m2.5-7.5c0-1-1.1-1.5-2.5-1.5s-2.5.6-2.5 1.6c0 2.4 5 1.4 5 3.8 0 1-1.1 1.6-2.5 1.6s-2.5-.5-2.5-1.5',
  // Language
  language: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z',
  // Visa & travel
  passport: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6V3Zm5.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 18h6',
  plane: 'M3 13.5 21 4l-4.5 9.5L21 20l-8.5-3L9 21l-.5-5L3 13.5Z',
  // Utility
  check: 'M5 12.5 9.5 17 19 7',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z',
  shield: 'M12 3 5 6v6c0 4.4 3 8.2 7 9 4-.8 7-4.6 7-9V6l-7-3Zm-2.5 9 2 2 3.5-3.5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.5V12l3.5 2',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4',
  cross: 'M6 6l12 12M18 6 6 18',
}

/** Service category → icon. Keeps the catalogue visual without hand-tagging each row. */
const CATEGORY_ICON: Record<string, IconName> = {
  'Getting started': 'compass',
  'Applications & documents': 'document',
  Funding: 'coin',
  'English & career': 'language',
  'Visa & travel': 'passport',
  'Other services': 'globe',
}

/** Service name → icon, so a CV row does not look like a visa row. */
const TITLE_ICON: Array<[RegExp, IconName]> = [
  [/career/i, 'briefcase'],
  [/statement of purpose|sop/i, 'document'],
  [/cv|r[eé]sum[eé]/i, 'cv'],
  [/submission|application/i, 'send'],
  [/scholarship|funding/i, 'coin'],
  [/ielts|english/i, 'language'],
  [/visa/i, 'passport'],
  [/departure|travel|accommodation/i, 'plane'],
  [/matching|shortlist/i, 'route'],
  [/assessment|profile/i, 'compass'],
]

export function iconForService(category: string, title: string): IconName {
  for (const [pattern, icon] of TITLE_ICON) {
    if (pattern.test(title)) return icon
  }
  return CATEGORY_ICON[category] || 'globe'
}

export default function Icon({
  name,
  className = '',
  size = 20,
}: {
  name: IconName
  className?: string
  size?: number
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] || PATHS.globe} />
    </svg>
  )
}
