/**
 * Kernel · collection definitions
 * ---------------------------------------------------------------------------
 * Each entry here produces, for free: an admin list, an admin form, a public
 * detail page (when `publicPath` is set) and a filterable data source for
 * blocks. Records live in the shared `entries` table — no migration needed.
 */

import { registerCollection, type CollectionDef } from './types'

const COUNTRIES = [
  'Malaysia',
  'Cyprus',
  'Hungary',
  'Germany',
  'United Kingdom',
  'Australia',
  'Canada',
  'United States',
  'Ireland',
  'Netherlands',
  'Poland',
  'Turkey',
  'United Arab Emirates',
  'Singapore',
  'Japan',
  'South Korea',
  'New Zealand',
  'Other',
]

const CURRENCIES = ['MYR', 'EUR', 'USD', 'GBP', 'AUD', 'CAD', 'HUF', 'SGD', 'TRY', 'Other']

const LEVELS = ['Foundation', 'Diploma', "Bachelor's", "Master's", 'PhD']

registerCollection({
  name: 'universities',
  label: 'Universities',
  singular: 'University',
  hint: 'Partner institutions shown in the university directory.',
  titleKey: 'name',
  slugKey: 'name',
  publicPath: (slug) => `/universities/${slug}`,
  columns: ['abbr', 'country', 'ownership', 'tuition_from', 'featured'],
  initial: () => ({ levels: [], disciplines: [], programs: [], featured: false, currency: 'USD' }),
  fields: [
    { key: 'name', label: 'University name', type: 'text', span: 2, required: true },
    { key: 'abbr', label: 'Short code', type: 'text', span: 1, placeholder: 'e.g. TUM', help: 'Used on the card badge.' },
    { key: 'country', label: 'Country', type: 'select', options: COUNTRIES, span: 1 },
    { key: 'city', label: 'City / campus', type: 'text', span: 1 },
    { key: 'ownership', label: 'Public or private', type: 'select', options: ['Public', 'Private'], span: 1 },
    { key: 'summary', label: 'One-line summary', type: 'textarea', span: 2, help: 'Shown on the directory card.' },
    { key: 'about', label: 'Full description', type: 'richtext', span: 2 },
    { key: 'tuition_from', label: 'Tuition from', type: 'number', span: 1, help: 'Enter 0 to show "No tuition".' },
    { key: 'currency', label: 'Currency', type: 'select', options: CURRENCIES, span: 1 },
    { key: 'levels', label: 'Degree levels', type: 'list', span: 1, help: 'One per line.' },
    { key: 'disciplines', label: 'Disciplines', type: 'list', span: 1, help: 'One per line.' },
    { key: 'ranking', label: 'Ranking', type: 'text', span: 1, placeholder: 'e.g. QS #167 world' },
    { key: 'founded', label: 'Founded', type: 'text', span: 1 },
    { key: 'website', label: 'Website', type: 'url', span: 2 },
    { key: 'requirements', label: 'Entry requirements', type: 'textarea', span: 2, help: 'One requirement per line.' },
    {
      key: 'programs',
      label: 'Programmes',
      type: 'repeater',
      span: 2,
      itemLabel: 'name',
      fields: [
        { key: 'name', label: 'Programme', type: 'text', span: 2 },
        { key: 'level', label: 'Level', type: 'select', options: LEVELS, span: 1 },
        { key: 'duration', label: 'Duration', type: 'text', span: 1, placeholder: '3 years' },
        { key: 'tuition', label: 'Tuition', type: 'text', span: 2, placeholder: 'MYR 34,000 / year' },
      ],
    },
    { key: 'cover', label: 'Cover image', type: 'image', span: 2 },
    { key: 'logo', label: 'Logo', type: 'image', span: 2 },
    { key: 'featured', label: 'Show on the home page', type: 'boolean', span: 2 },
  ],
})

registerCollection({
  name: 'scholarships',
  label: 'Scholarships',
  singular: 'Scholarship',
  hint: 'Funding opportunities shown in the scholarship directory.',
  titleKey: 'name',
  slugKey: 'name',
  publicPath: (slug) => `/scholarships/${slug}`,
  columns: ['provider', 'provider_type', 'amount', 'deadline', 'featured'],
  initial: () => ({ levels: [], countries: [], disciplines: [], featured: false }),
  fields: [
    { key: 'name', label: 'Scholarship name', type: 'text', span: 2, required: true },
    { key: 'provider', label: 'Provided by', type: 'text', span: 1 },
    {
      key: 'provider_type',
      label: 'Provider type',
      type: 'select',
      options: ['University', 'Government', 'Independent provider', 'Foundation', 'Corporate'],
      span: 1,
    },
    {
      key: 'award_type',
      label: 'Award type',
      type: 'select',
      options: ['Full funding', 'Tuition waiver', 'Grant', 'Monthly stipend', 'Partial award', 'Other'],
      span: 1,
    },
    { key: 'amount', label: 'Amount', type: 'text', span: 1, placeholder: 'EUR 1,400 / month' },
    { key: 'deadline', label: 'Deadline', type: 'date', span: 1, help: 'Leave empty for "Not specified".' },
    { key: 'apply_url', label: 'Application link', type: 'url', span: 1 },
    { key: 'summary', label: 'One-line summary', type: 'textarea', span: 2 },
    { key: 'levels', label: 'Degree levels', type: 'list', span: 1 },
    { key: 'countries', label: 'Countries', type: 'list', span: 1 },
    { key: 'disciplines', label: 'Disciplines', type: 'list', span: 2, help: 'Use "Any" if it is open to all fields.' },
    { key: 'eligibility', label: 'Eligibility', type: 'richtext', span: 2 },
    { key: 'featured', label: 'Show on the home page', type: 'boolean', span: 2 },
  ],
})

registerCollection({
  name: 'services',
  label: 'Services',
  singular: 'Service',
  hint: 'The service catalogue, its stages and its pricing.',
  titleKey: 'title',
  slugKey: 'title',
  columns: ['category', 'tag', 'price_value', 'duration_weeks'],
  initial: () => ({ includes: [], price_value: 0, duration_weeks: 0 }),
  fields: [
    { key: 'title', label: 'Service name', type: 'text', span: 2, required: true },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      span: 1,
      options: [
        'Getting started',
        'Applications & documents',
        'English & career',
        'Funding',
        'Visa & travel',
        'Other services',
      ],
      help: 'The service list groups by this when grouping is switched on.',
    },
    { key: 'tag', label: 'Stage label', type: 'text', span: 1, placeholder: 'Stage 1 / Add-on / Included' },
    { key: 'price', label: 'Fee (as shown)', type: 'text', span: 1, placeholder: 'From USD 150' },
    { key: 'duration', label: 'Timeline (as shown)', type: 'text', span: 1, placeholder: '2–4 weeks' },
    {
      key: 'price_value',
      label: 'Fee in USD',
      type: 'number',
      span: 1,
      help: 'Used to total a self-built plan. Enter 0 for free services.',
    },
    {
      key: 'duration_weeks',
      label: 'Weeks',
      type: 'number',
      span: 1,
      help: 'Used to estimate the plan timeline.',
    },
    { key: 'summary', label: 'Short summary', type: 'textarea', span: 2, help: 'One line, shown on the card.' },
    { key: 'body', label: 'Detail', type: 'richtext', span: 2 },
    { key: 'includes', label: 'What is included', type: 'list', span: 2, help: 'One item per line.' },
    { key: 'outcome', label: 'What you end up with', type: 'text', span: 2, placeholder: 'e.g. A submission-ready SOP' },
  ],
})

registerCollection({
  name: 'countries',
  label: 'Destinations',
  singular: 'Destination',
  hint: 'Country guides. The ISO code and status drive the world map.',
  titleKey: 'name',
  slugKey: 'name',
  publicPath: (slug) => `/destinations/${slug}`,
  columns: ['flag', 'iso', 'map_status', 'tuition_from', 'currency'],
  initial: () => ({ popular_for: [], featured: false, currency: 'USD', map_status: 'Not live yet' }),
  fields: [
    { key: 'name', label: 'Country', type: 'text', span: 1, required: true },
    { key: 'flag', label: 'Flag', type: 'text', span: 1, placeholder: '🇲🇾', help: 'Paste the emoji.' },
    {
      key: 'iso',
      label: 'ISO country code',
      type: 'text',
      span: 1,
      placeholder: 'MY',
      help: 'Two letters. This is how the country is found on the world map.',
    },
    {
      key: 'map_status',
      label: 'World map status',
      type: 'select',
      span: 1,
      options: ['Live', 'In progress', 'Not live yet'],
      help: 'Live lights the country up. In progress shows it as half-lit.',
    },
    { key: 'intro', label: 'Introduction', type: 'textarea', span: 2 },
    { key: 'tuition_from', label: 'Tuition from', type: 'number', span: 1 },
    { key: 'currency', label: 'Currency', type: 'select', options: CURRENCIES, span: 1 },
    { key: 'living_cost', label: 'Living cost', type: 'text', span: 1, placeholder: 'EUR 450–750 / month' },
    { key: 'intakes', label: 'Intakes', type: 'text', span: 1, placeholder: 'February, September' },
    { key: 'visa', label: 'Visa notes', type: 'textarea', span: 2 },
    { key: 'popular_for', label: 'Popular for', type: 'list', span: 2, help: 'One discipline per line.' },
    { key: 'cover', label: 'Cover image', type: 'image', span: 2 },
    { key: 'featured', label: 'Show on the home page', type: 'boolean', span: 2 },
  ],
})

registerCollection({
  name: 'advisors',
  label: 'Advisors',
  singular: 'Advisor',
  hint: 'Team members shown in the “team” block.',
  titleKey: 'name',
  slugKey: 'name',
  columns: ['role', 'focus', 'email'],
  initial: () => ({}),
  fields: [
    { key: 'name', label: 'Full name', type: 'text', span: 2, required: true },
    { key: 'role', label: 'Role', type: 'text', span: 1, placeholder: 'Senior Admissions Counsellor' },
    { key: 'focus', label: 'Focus', type: 'text', span: 1, placeholder: 'Germany · Hungary · Scholarships' },
    { key: 'bio', label: 'Short biography', type: 'textarea', span: 2 },
    { key: 'email', label: 'Email', type: 'text', span: 1 },
    { key: 'linkedin', label: 'LinkedIn', type: 'url', span: 1 },
    { key: 'photo', label: 'Photo', type: 'image', span: 2 },
  ],
})

registerCollection({
  name: 'posts',
  label: 'Guides',
  singular: 'Guide',
  hint: 'Articles and guides published on the blog.',
  titleKey: 'title',
  slugKey: 'title',
  publicPath: (slug) => `/blog/${slug}`,
  columns: ['published_at', 'read_minutes', 'tags'],
  initial: () => ({ tags: [], read_minutes: 5, published_at: new Date().toISOString().slice(0, 10) }),
  fields: [
    { key: 'title', label: 'Title', type: 'text', span: 2, required: true },
    { key: 'excerpt', label: 'Standfirst', type: 'textarea', span: 2, help: 'One or two sentences shown in listings.' },
    { key: 'published_at', label: 'Published', type: 'date', span: 1 },
    { key: 'read_minutes', label: 'Reading time (minutes)', type: 'number', span: 1 },
    { key: 'tags', label: 'Tags', type: 'list', span: 2, help: 'One per line.' },
    { key: 'cover', label: 'Cover image', type: 'image', span: 2 },
    { key: 'body', label: 'Body', type: 'richtext', span: 2, help: 'Supports ## headings, **bold**, *italic*, - lists and [links](url).' },
  ],
})

export const collectionDefs = () => {
  return { COUNTRIES, CURRENCIES, LEVELS } as const
}

export type { CollectionDef }
