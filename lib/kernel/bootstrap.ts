/**
 * Kernel · schema + first-run seed
 * ---------------------------------------------------------------------------
 * Nine tables. Everything the site shows is either a `page` (a stack of
 * `blocks`) or an `entry` (a record inside a named collection). Adding a new
 * content type therefore needs no migration — only a collection definition.
 */

import { driver, raw, type Row } from './db'
import { id } from './ids'
import { DICTIONARY } from './dictionary'

const DDL = `
create table if not exists users (
  id            serial primary key,
  email         text unique not null,
  password_hash text not null,
  name          text not null default '',
  role          text not null default 'admin',
  created_at    timestamptz not null default now()
);

create table if not exists pages (
  id               serial primary key,
  slug             text unique not null,
  title            text not null default '',
  seo_title        text not null default '',
  seo_description  text not null default '',
  status           text not null default 'published',
  show_in_nav      boolean not null default false,
  nav_label        text not null default '',
  nav_order        integer not null default 0,
  updated_at       timestamptz not null default now()
);

create table if not exists blocks (
  id         text primary key,
  page_id    integer not null references pages(id) on delete cascade,
  type       text not null,
  position   integer not null default 0,
  enabled    boolean not null default true,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blocks_page_position_idx on blocks(page_id, position);

create table if not exists entries (
  id         text primary key,
  collection text not null,
  slug       text,
  title      text not null default '',
  status     text not null default 'published',
  position   integer not null default 0,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entries_collection_idx on entries(collection, position);
create unique index if not exists entries_collection_slug_idx on entries(collection, slug);

create table if not exists settings (
  key   text primary key,
  value jsonb not null default '{}'::jsonb
);

create table if not exists translations (
  locale     text not null,
  key        text not null,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  primary key (locale, key)
);

create table if not exists media (
  id         text primary key,
  url        text not null,
  filename   text not null default '',
  alt        text not null default '',
  mime       text not null default '',
  size       integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id         text primary key,
  name       text not null default '',
  email      text not null default '',
  phone      text not null default '',
  whatsapp   text not null default '',
  country    text not null default '',
  level      text not null default '',
  message    text not null default '',
  source     text not null default '',
  status     text not null default 'new',
  notes      text not null default '',
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
-- Idempotent upgrade for installs created before the application form existed.
alter table leads add column if not exists data jsonb not null default '{}'::jsonb;

create table if not exists revisions (
  id         serial primary key,
  block_id   text not null,
  data       jsonb not null,
  actor      text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id         serial primary key,
  actor      text not null default '',
  action     text not null default '',
  target     text not null default '',
  created_at timestamptz not null default now()
);
`

export async function migrate(): Promise<void> {
  const d = await driver()
  await d.exec(DDL)
}

/* -------------------------------------------------------------------------- */
/* Seed                                                                        */
/* -------------------------------------------------------------------------- */

const S = 'https://images.unsplash.com'
const img = (photo: string, w = 1600) => `${S}/${photo}?auto=format&fit=crop&w=${w}&q=80`

/**
 * Everything that identifies the business is deliberately empty. The owner
 * fills it in from Admin → Site settings; the admin dashboard shows a checklist
 * of what is still blank.
 */
const SETTINGS: Record<string, any> = {
  identity: {
    site_name: 'International Study Council',
    site_short: 'ISC',
    tagline: 'Study abroad, made clear.',
    logo_text: '',
    description: '',
  },
  /* PLACEHOLDERS — replace these in Admin → Site settings.
     The WhatsApp number is in a reserved fictional range and cannot reach anyone. */
  contact: {
    email: 'hello@internationalstudycouncil.com',
    phone: '+1 202 555 0143',
    whatsapp: '+12025550143',
    whatsapp_message: "Hi ISC, I'd like a free study-abroad assessment.",
    address: '',
    hours: '',
  },
  social: {
    linkedin: 'https://www.linkedin.com/company/international-study-council/',
    facebook: 'https://www.facebook.com/internationalstudycouncil',
    instagram: '',
  },
  theme: {
    accent: '#1B48D6',
    accent_ink: '#0F2E8C',
  },
  seo: {
    default_title: 'International Study Council — Study abroad, made clear',
    default_description:
      'Free profile assessment, university matching, scholarship guidance and visa support for international students.',
  },
  languages: {
    enabled: ['en', 'bn', 'es', 'fr', 'ar', 'ru'],
    default: 'en',
  },
}

const PAGES: Array<{
  slug: string
  title: string
  seo_title: string
  seo_description: string
  show_in_nav: boolean
  nav_label: string
  nav_order: number
  blocks: Array<{ type: string; data: Record<string, any> }>
}> = [
  {
    slug: 'home',
    title: 'Home',
    seo_title: 'International Study Council — Study abroad, made clear',
    seo_description:
      'Independent advisors for university admission, scholarships and student visas. Ten services, priced per stage. Free assessment.',
    show_in_nav: false,
    nav_label: 'Home',
    nav_order: 0,
    blocks: [
      {
        type: 'hero',
        data: {
          eyebrow: 'International Study Council',
          headline: 'There are many consultants.\nThis one is yours.',
          body: 'Tell us where you want to go and what you can afford. We map the universities, the funding and the visa route that actually fits you.',
          primary_label: 'Start your application',
          primary_href: '/apply',
          secondary_label: 'Build your own plan',
          secondary_href: '/plan',
          show_mark: true,
          show_search: true,
          footnote: 'Free assessment. No fees until you hold an offer.',
          variant: 'mark',
        },
      },
      {
        type: 'scrolly',
        data: {
          label: '',
          title: '',
          body: '',
          service_limit: 6,
          sections: [
            {
              id: 'services',
              label: 'Services',
              title: 'What we do',
              body: 'Ten services across five stages, priced individually. Take one, take all, or take none — the assessment is free either way.',
              points: [
                'Getting started — assessment, career planning, university matching',
                'Applications — SOP, CV, submission',
                'Funding — scholarships and grants you actually qualify for',
                'English & career — IELTS, PTE and interview preparation',
                'Visa & travel — the visa file and everything after it',
              ],
              cta_label: 'See all ten services',
              cta_href: '/services',
            },
            {
              id: 'process',
              label: 'How it works',
              title: 'Four steps, roughly six weeks',
              body: 'We run the work in parallel wherever we can, so the timeline is set by the longest single piece rather than the sum of them.',
              points: [
                'Assessment — a 30-minute call, and an honest read on what is realistic',
                'Shortlist — five to eight programmes with total cost and admission odds',
                'Application — SOP, CV and submission, with scholarship forms filed alongside',
                'Visa & arrival — the visa file, then accommodation and a briefing',
              ],
              cta_label: 'Build your own plan',
              cta_href: '/plan',
            },
            {
              id: 'search',
              label: 'Search',
              title: 'Search your destination',
              body: 'One search box covers every university, scholarship and guide on the site. Add filters to narrow by country, level or discipline.',
              points: [
                'Search everything at once — institutions, funding, guides',
                'Filter by country, degree level and discipline',
                'Press ⌘K anywhere on the site',
              ],
              cta_label: 'Browse universities',
              cta_href: '/universities',
            },
            {
              id: 'map',
              label: 'Global reach',
              title: 'Where we can take you',
              body: 'A country lights up once the full service set is running there. Countries still being set up are shown half-lit, so you can see where we are heading.',
              points: [
                'Six countries live, eight more being set up',
                'Every destination page covers tuition, living costs and visa rules',
                'No destination we cannot support end to end',
              ],
              cta_label: 'All destinations',
              cta_href: '/destinations',
            },
            {
              id: 'apply',
              label: 'Apply',
              title: 'Talk to an advisor',
              body: 'Three short steps, nothing charged and nothing committed. An advisor reads it and replies within one working day.',
              points: [
                'About you — who we are advising and how to reach you',
                'Your plans — where, what level, what budget',
                'How we can help — tick the services you want',
              ],
              cta_label: 'Start your application',
              cta_href: '/apply',
            },
            {
              id: 'why',
              label: 'Why us',
              title: 'Why students pick us',
              body: 'Most agencies sell you a university. We sell you a decision you can defend — and we tell you when the answer is not to go.',
              points: [
                'We say no when we should',
                'The price is the price',
                'One advisor, start to finish',
                'We publish our refusals',
              ],
              cta_label: 'Start your application',
              cta_href: '/apply',
            },
          ],
        },
      },
      {
        type: 'values',
        data: {
          label: 'Boundaries',
          title: "What we don't do",
          body: 'Most of this industry runs on promises it cannot keep. Here is where we draw the line.',
          items: [
            {
              title: 'No guaranteed admission',
              body: 'Nobody can promise an offer, and anyone who does is lying to you. We give you a probability and the reasoning behind it.',
            },
            {
              title: 'No buying your way in',
              body: 'We do not forge transcripts, invent financial evidence, or pay anyone off. If you ask, we will decline and end the engagement.',
            },
            {
              title: 'No silence after you pay',
              body: 'You get a named advisor, a written scope and a reply within one working day. We do not disappear once the invoice clears.',
            },
            {
              title: 'No undisclosed commission',
              body: 'Where a university pays us for a referral, it is printed on your shortlist next to that university. Always.',
            },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          headline: 'Start with the free assessment.',
          body: 'Thirty minutes, no obligation. You leave with a shortlist and a realistic budget — whether or not you use us.',
          primary_label: 'Start your application',
          primary_href: '/apply',
          secondary_label: 'See the services',
          secondary_href: '/services',
          variant: 'ink',
        },
      },
      { type: 'whatsappFloat', data: { label: 'Chat on WhatsApp' } },
    ],
  },
  {
    slug: 'apply',
    title: 'Apply',
    seo_title: 'Start your application — International Study Council',
    seo_description:
      'Tell us about your background and what you need help with. Free assessment, reply within one working day.',
    show_in_nav: false,
    nav_label: 'Apply',
    nav_order: 9,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Application',
          title: 'Start your application',
          body: 'Three short steps. Nothing is charged and nothing is committed — this is how we work out whether we can help you, and how.',
        },
      },
      {
        type: 'applicationForm',
        data: {
          label: 'Application form',
          title: '',
          body: '',
          submit_label: 'Submit my application',
          success_title: 'Application received',
          success_body:
            'An advisor will review your details and reply within one working day. If it is urgent, message us on WhatsApp.',
          steps: [
            { title: 'About you', description: 'So we know who we are advising and how to reach you.' },
            { title: 'Your study plans', description: 'Rough answers are fine — we will refine them together.' },
            { title: 'How we can help', description: 'Tick everything you want help with. You can change this later.' },
          ],
          fields: [
            { key: 'name', label: 'Full name', type: 'text', step: 1, required: true },
            { key: 'email', label: 'Email', type: 'email', step: 1, required: true },
            { key: 'phone', label: 'Phone', type: 'tel', step: 1 },
            { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', step: 1, help: 'Include the country code.' },
            { key: 'nationality', label: 'Nationality', type: 'text', step: 1 },
            { key: 'current_city', label: 'Where you are now', type: 'text', step: 1 },

            {
              key: 'current_qualification',
              label: 'Highest qualification so far',
              type: 'select',
              step: 2,
              options: [
                'Secondary school / high school',
                'Foundation programme',
                'Diploma',
                "Bachelor's — in progress",
                "Bachelor's — completed",
                "Master's — completed",
              ],
            },
            { key: 'institution', label: 'School or university', type: 'text', step: 2 },
            { key: 'result', label: 'Result or GPA', type: 'text', step: 2, placeholder: 'e.g. GPA 3.2/4.0, or 78%' },
            { key: 'graduation_year', label: 'Year completed', type: 'text', step: 2, placeholder: '2026' },
            {
              key: 'english_test',
              label: 'English test',
              type: 'select',
              step: 2,
              options: ['Not taken yet', 'IELTS', 'TOEFL', 'PTE', 'Duolingo', 'My degree was taught in English'],
            },
            { key: 'english_score', label: 'English score', type: 'text', step: 2, placeholder: 'e.g. IELTS 6.0 overall' },
            {
              key: 'country',
              label: 'Preferred destination',
              type: 'select',
              step: 2,
              options: [
                'Malaysia',
                'Cyprus',
                'Hungary',
                'Germany',
                'United Kingdom',
                'Australia',
                'Not sure yet — advise me',
              ],
            },
            {
              key: 'level',
              label: 'Level of study',
              type: 'select',
              step: 2,
              options: ['Foundation', 'Diploma', "Bachelor's", "Master's", 'PhD'],
            },
            { key: 'field_of_study', label: 'Subject you want to study', type: 'text', step: 2 },
            {
              key: 'intake',
              label: 'Preferred intake',
              type: 'select',
              step: 2,
              options: ['January 2027', 'May 2027', 'September 2027', 'January 2028', 'Not sure yet'],
            },
            {
              key: 'budget',
              label: 'Annual budget for tuition',
              type: 'select',
              step: 2,
              options: [
                'Under USD 5,000',
                'USD 5,000 – 10,000',
                'USD 10,000 – 20,000',
                'Above USD 20,000',
                'I need full funding',
              ],
            },

            {
              key: 'services',
              label: 'What would you like help with?',
              type: 'checkboxes',
              step: 3,
              required: true,
              options: [
                'Statement of Purpose (SOP)',
                'CV & Résumé writing',
                'Career counselling & planning',
                'University & course matching',
                'Application submission',
                'Scholarship & funding guidance',
                'IELTS & English test preparation',
                'Visa application',
                'Pre-departure support',
              ],
            },
            {
              key: 'documents_ready',
              label: 'What do you have ready?',
              type: 'select',
              step: 3,
              options: ['Everything', 'Transcripts and certificates', 'Just my results so far', 'Nothing yet'],
            },
            {
              key: 'hear_about',
              label: 'How did you find us?',
              type: 'select',
              step: 3,
              options: ['Facebook', 'Instagram', 'LinkedIn', 'WhatsApp', 'A friend or family member', 'Google search', 'Other'],
            },
            {
              key: 'message',
              label: 'Anything else we should know?',
              type: 'textarea',
              step: 3,
              placeholder: 'Gaps in your study history, a previous refusal, a deadline you are working towards…',
            },
          ],
        },
      },
      {
        type: 'faq',
        data: {
          label: 'Before you start',
          title: 'What happens after you submit',
          items: [
            {
              question: 'What happens to my details?',
              answer:
                'They go into our own database and are visible only to our advisors. We do not sell them and we do not pass them to universities until you ask us to submit an application.',
            },
            {
              question: 'Is the assessment really free?',
              answer:
                'Yes. The call and the written shortlist cost nothing, and there is no obligation to buy anything afterwards. You are welcome to take the shortlist and apply yourself.',
            },
            {
              question: 'How quickly will I hear back?',
              answer:
                'Within one working day. If your intake is imminent, say so in the message field and we will prioritise it.',
            },
            {
              question: 'I am not sure which service I need.',
              answer:
                'Tick everything that sounds relevant, or tick nothing at all. The first call is where we work out what is actually worth paying for.',
            },
          ],
        },
      },
      {
        type: 'contactDetails',
        data: { label: 'Direct', title: 'Or reach us directly', body: 'If the form feels like too much, just message us.' },
      },
      { type: 'whatsappFloat', data: { label: 'Chat on WhatsApp' } },
    ],
  },
  {
    slug: 'destinations',
    title: 'Destinations',
    seo_title: 'Study destinations — International Study Council',
    seo_description:
      'Where you can study with us: tuition, living costs, visa rules and intakes for every country we cover.',
    show_in_nav: false,
    nav_label: 'Destinations',
    nav_order: 9,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Destinations',
          title: 'Where we can take you',
          body: 'A country lights up once we have the full service set running there. Countries still being set up are shown half-lit, so you can see where we are heading.',
        },
      },
      {
        type: 'worldMap',
        data: {
          label: 'Global reach',
          title: '',
          body: '',
          tone: 'ink',
          show_progress: true,
          cta_label: '',
          cta_href: '',
        },
      },
      {
        type: 'countryCards',
        data: { label: 'All destinations', title: '', body: '', limit: 24, cta_label: '', cta_href: '' },
      },
      {
        type: 'cta',
        data: {
          headline: 'Not sure which country fits your budget?',
          body: 'Tell us your numbers and we will tell you honestly where you can afford to go.',
          primary_label: 'Start your application',
          primary_href: '/apply',
          secondary_label: 'Browse universities',
          secondary_href: '/universities',
          variant: 'ink',
        },
      },
    ],
  },
  {
    slug: 'plan',
    title: 'Build your plan',
    seo_title: 'Build your own study-abroad plan — International Study Council',
    seo_description:
      'Pick the services you actually need, see the cost and timeline update as you build, and send the plan to an advisor.',
    show_in_nav: true,
    nav_label: 'Build a plan',
    nav_order: 1,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Your plan',
          title: 'Build your plan',
          body: 'Nobody needs every service. Pick the blocks that fit where you are, see exactly what it costs, and send it to us when you are ready.',
        },
      },
      {
        type: 'planBuilder',
        data: {
          label: '',
          title: '',
          body: '',
          cta_href: '/apply',
        },
      },
      {
        type: 'faq',
        data: {
          label: 'Questions',
          title: 'About building a plan',
          items: [
            {
              question: 'Is this the final price?',
              answer:
                'It is the list price for each service. Your written quote confirms it, and we will tell you if a service is not worth buying in your situation.',
            },
            {
              question: 'Can I change my plan later?',
              answer:
                'Yes. Plans change as students get offers, change their mind about a country, or run out of time. Nothing here locks you in.',
            },
            {
              question: 'What if I pick nothing?',
              answer:
                'Then book the free assessment. That is genuinely enough for plenty of students — we will tell you what you can do yourself.',
            },
            {
              question: 'How is the timeline calculated?',
              answer:
                'It is the longest single service in your plan, because we run the work in parallel wherever we can rather than one after another.',
            },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          headline: 'Rather just talk it through?',
          body: 'Book the free assessment and we will tell you which blocks are actually worth paying for.',
          primary_label: 'Free assessment',
          primary_href: '/apply',
          secondary_label: 'See all services',
          secondary_href: '/services',
          variant: 'ink',
        },
      },
      { type: 'whatsappFloat', data: { label: 'Chat on WhatsApp' } },
    ],
  },
  {
    slug: 'universities',
    title: 'Universities',
    seo_title: 'Universities — International Study Council',
    seo_description: 'Browse partner universities by country, degree level, discipline and tuition.',
    show_in_nav: true,
    nav_label: 'Universities',
    nav_order: 2,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Directory',
          title: 'Universities',
          body: 'Filter by destination, degree level and tuition. Every listing shows the entry requirements we know are accurate as of this intake.',
        },
      },
      {
        type: 'universityList',
        data: {
          label: '',
          title: '',
          mode: 'all',
          limit: 60,
          layout: 'grid',
          filters: true,
          cta_label: '',
          cta_href: '',
        },
      },
    ],
  },
  {
    slug: 'scholarships',
    title: 'Scholarships',
    seo_title: 'Scholarships — International Study Council',
    seo_description: 'Scholarships and funding for international students, by country and discipline.',
    show_in_nav: true,
    nav_label: 'Scholarships',
    nav_order: 3,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Funding',
          title: 'Scholarships',
          body: 'University merit awards, government schemes and early-application grants. Deadlines are shown in your local time.',
        },
      },
      {
        type: 'scholarshipList',
        data: {
          label: '',
          title: '',
          mode: 'all',
          limit: 60,
          filters: true,
          cta_label: '',
          cta_href: '',
        },
      },
      {
        type: 'faq',
        data: {
          label: 'Questions',
          title: 'Scholarship questions we get every week',
          items: [
            {
              question: 'Do I need to be admitted before applying for a scholarship?',
              answer:
                'Usually yes for university merit awards — you are assessed automatically with your admission file. Government schemes like Chevening and DAAD have separate applications that open months earlier.',
            },
            {
              question: 'Can I combine more than one scholarship?',
              answer:
                'Sometimes. Most universities cap total support at 50% of tuition. We check the stacking rules before you commit.',
            },
            {
              question: 'What if I miss the deadline?',
              answer:
                'Many awards reopen each intake. We keep a list of rolling and anytime-deadline funding so there is almost always something open.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'services',
    title: 'Services',
    seo_title: 'Services — International Study Council',
    seo_description: 'Assessment, applications, scholarships, visa support and pre-departure help.',
    show_in_nav: true,
    nav_label: 'Services',
    nav_order: 4,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Services',
          title: 'What we actually do',
          body: 'Ten services across the whole journey — from working out what to study, to landing with your keys in hand. Priced per stage, so you only pay for the parts you need.',
        },
      },
      {
        type: 'serviceList',
        data: {
          label: 'Service catalogue',
          title: '',
          body: '',
          limit: 24,
          columns: '3',
          grouped: true,
        },
      },
      {
        type: 'priceTable',
        data: {
          label: 'Fees',
          title: 'What each service costs',
          body: 'Every fee is agreed in writing before any work starts. Nothing here is a subscription and nothing renews on its own.',
          show_includes: true,
        },
      },
      {
        type: 'steps',
        data: {
          label: 'Timeline',
          title: 'A typical intake, week by week',
          items: [
            { title: 'Week 1', body: 'Assessment call, document checklist, budget confirmed.' },
            { title: 'Week 2–3', body: 'Shortlist written up. You approve the final five programmes.' },
            { title: 'Week 4–6', body: 'SOP and CV prepared, applications submitted, scholarship forms filed in parallel.' },
            { title: 'Week 7+', body: 'Offers arrive. We compare them on total cost and help you accept.' },
            { title: 'After acceptance', body: 'Visa file, accommodation, insurance, flights and pre-departure briefing.' },
          ],
        },
      },
      {
        type: 'faq',
        data: {
          label: 'Questions',
          title: 'Before you buy anything',
          items: [
            {
              question: 'Do I have to buy the whole package?',
              answer:
                'No. Every service is priced on its own. Plenty of students take the free assessment and the SOP review and do the rest themselves — that is a perfectly good outcome for us.',
            },
            {
              question: 'Can you write my SOP for me?',
              answer:
                'We draft it with you, from an interview where we extract your material. We do not sell pre-written statements, and we run every draft through a plagiarism and AI-detection check before you submit.',
            },
            {
              question: 'What if my application is refused or my visa is rejected?',
              answer:
                'A refusal is not the end. We review the refusal reason, tell you honestly whether a reapplication is worth it, and support the second attempt at no extra service fee.',
            },
            {
              question: 'Do you guarantee a visa?',
              answer:
                'Nobody can. We guarantee that your file is complete, compliant and built to the current embassy checklist — which is the part that is actually in our control.',
            },
            {
              question: 'How do I pay?',
              answer:
                'Stage by stage, in writing, before each stage begins. The assessment is free, and nothing is charged until you have seen the fee in your engagement letter.',
            },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          headline: 'Not sure which stage you need?',
          body: 'Tell us where you are in the process. We will tell you what is worth paying for and what you can do yourself.',
          primary_label: 'Start your application',
          primary_href: '/apply',
          secondary_label: 'See scholarships',
          secondary_href: '/scholarships',
          variant: 'ink',
        },
      },
    ],
  },
  {
    slug: 'about',
    title: 'About',
    seo_title: 'About — International Study Council',
    seo_description: 'Who we are, how we are funded and why we work the way we do.',
    show_in_nav: false,
    nav_label: 'About',
    nav_order: 9,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'About',
          title: 'Independent advice, in writing',
          body: 'International Study Council was founded in 2016 to give students the comparison nobody else would put on paper.',
        },
      },
      {
        type: 'imageText',
        data: {
          label: 'How we work',
          title: 'We put the full comparison in front of you',
          body: 'Most students never see the real numbers. We write them down: total tuition, living costs, scholarship eligibility, visa financial requirement, and the honest probability of admission for your profile.\n\nWe are paid by students, not by universities. Where a university does pay us a referral, you will see it stated on your shortlist.',
          bullets: [
            'Written shortlists with total cost of attendance',
            'Commission disclosure on every recommendation',
            'No fees until you hold an offer',
          ],
          media: img('photo-1523240795612-9a054b0db644'),
          image_side: 'right',
        },
      },
      {
        type: 'stats',
        data: {
          label: 'Track record',
          items: [
            { value: '2016', label: 'Founded' },
            { value: '1,800+', label: 'Students placed' },
            { value: '96%', label: 'Visa approval' },
            { value: '12', label: 'Countries' },
          ],
        },
      },
      {
        type: 'advisors',
        data: { label: 'Team', title: 'Advisors', limit: 6 },
      },
      {
        type: 'marquee',
        data: {
          label: 'Partner institutions',
          items: [
            { text: "Taylor's University" },
            { text: 'Sunway University' },
            { text: 'Monash Malaysia' },
            { text: 'University of Nicosia' },
            { text: 'University of Debrecen' },
            { text: 'Coventry University' },
            { text: 'University of Wollongong' },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          headline: 'Come and ask us the hard questions.',
          body: 'We would rather talk you out of the wrong programme than sell you the right one.',
          primary_label: 'Book an assessment',
          primary_href: '/contact',
          secondary_label: 'Our services',
          secondary_href: '/services',
          variant: 'ink',
        },
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    seo_title: 'Contact — International Study Council',
    seo_description: 'Book a free study-abroad assessment, or reach us on WhatsApp.',
    show_in_nav: true,
    nav_label: 'Contact',
    nav_order: 5,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Contact',
          title: 'Free assessment',
          body: 'Fill this in and an advisor replies within one working day. Bring your transcripts, budget and any English test score.',
        },
      },
      {
        type: 'contactForm',
        data: {
          title: '',
          body: '',
          submit_label: 'Request my assessment',
          success_message: 'Thank you — your request is in. An advisor will reply within one working day.',
          fields: [
            { key: 'name', label: 'Full name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: false },
            { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', required: false },
            { key: 'country', label: 'Preferred destination', type: 'select', options: ['Malaysia', 'Cyprus', 'Hungary', 'Germany', 'United Kingdom', 'Australia', 'Not sure yet'] },
            { key: 'level', label: 'Level of study', type: 'select', options: ['Foundation', "Bachelor's", "Master's", 'PhD'] },
            { key: 'message', label: 'Anything else we should know?', type: 'textarea' },
          ],
        },
      },
      {
        type: 'contactDetails',
        data: { label: 'Direct', title: 'Or reach us directly' },
      },
    ],
  },
  {
    slug: 'blog',
    title: 'Guides',
    seo_title: 'Study abroad guides — International Study Council',
    seo_description: 'Practical guides on applications, scholarships, visas and budgeting for international students.',
    show_in_nav: false,
    nav_label: 'Guides',
    nav_order: 9,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Guides',
          title: 'Guides',
          body: 'Practical, unhyped writing about applying, funding and moving abroad.',
        },
      },
      { type: 'posts', data: { label: '', title: '', limit: 24, layout: 'list', cta_label: '', cta_href: '' } },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy policy',
    seo_title: 'Privacy policy — International Study Council',
    seo_description: 'How International Study Council collects, uses and stores the information you send us.',
    show_in_nav: false,
    nav_label: '',
    nav_order: 90,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Legal',
          title: 'Privacy policy',
          body: 'This page explains what we do with the information you send us through this website.',
        },
      },
      {
        type: 'richtext',
        data: {
          label: 'Last updated',
          title: '',
          width: 'narrow',
          body: "We collect only what we need to advise you: your name, email address, phone or WhatsApp number, the destination and level you are interested in, and anything you choose to write in the message field.\n\n## What we do with it\n\nWe use it to reply to your enquiry, to prepare your assessment, and to keep you updated about your application. We do not sell your information, and we do not pass it to universities without telling you first.\n\n## Where it is stored\n\nEnquiries are stored in our own database and are visible only to our advisors. Uploaded documents are shared with a university only when you ask us to submit an application on your behalf.\n\n## Cookies\n\nThis site uses no advertising or tracking cookies. If we add analytics later, this page will be updated before it goes live.\n\n## Your rights\n\nYou can ask us to show you what we hold about you, correct it, or delete it. Write to us and we will action it within 30 days.",
        },
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of service',
    seo_title: 'Terms of service — International Study Council',
    seo_description: 'The terms on which International Study Council provides advisory services.',
    show_in_nav: false,
    nav_label: '',
    nav_order: 91,
    blocks: [
      {
        type: 'pageHeader',
        data: {
          eyebrow: 'Legal',
          title: 'Terms of service',
          body: 'What you can expect from us, and what we ask of you.',
        },
      },
      {
        type: 'richtext',
        data: {
          label: 'Last updated',
          title: '',
          width: 'narrow',
          body: "## What we provide\n\nWe provide advice on university selection, applications, funding and student visas. The assessment and shortlist are free. Any further service is priced in writing before you commit to it.\n\n## What we cannot promise\n\nWe do not control admission decisions or visa outcomes. We will give you an honest assessment of your chances, but no advisor can guarantee an offer or a visa.\n\n## Your responsibilities\n\nYou are responsible for the accuracy of the documents you give us. Providing falsified transcripts or financial evidence can result in an offer being withdrawn and may be a criminal offence.\n\n## Fees\n\nWhere a university pays us a referral fee, it is disclosed on your shortlist. Service fees are refundable only in the circumstances set out in your engagement letter.\n\n## Complaints\n\nIf something goes wrong, tell us first. We will respond within five working days.",
        },
      },
    ],
  },
]

const UNIVERSITIES = [
  {
    name: "Taylor's University",
    slug: 'taylors-university',
    data: {
      abbr: 'TU',
      country: 'Malaysia',
      city: 'Subang Jaya, Selangor',
      ownership: 'Private',
      summary: 'Lakeside campus outside Kuala Lumpur, strongest for hospitality, business and design.',
      about:
        "Taylor's is consistently ranked the top private university in Malaysia. The Lakeside Campus is a 27-acre development built around a reclaimed lake, with hospitality and culinary facilities that are genuinely industry-grade.\n\nIt suits students who want a Malaysian degree with strong regional recognition and a campus that feels international from day one.",
      tuition_from: 32000,
      currency: 'MYR',
      levels: ["Foundation", "Bachelor's", "Master's"],
      disciplines: ['Business', 'Hospitality', 'Design', 'Computing'],
      ranking: 'QS #251 Asia',
      founded: '1969',
      featured: true,
      website: 'https://university.taylors.edu.my',
      requirements:
        "Bachelor's: SPM/O-Level equivalent with 5 credits, or A-Levels with 2 passes.\nMaster's: a recognised bachelor's degree with a minimum CGPA of 2.75.\nEnglish: IELTS 5.5–6.0 depending on programme.",
      programs: [
        { name: 'BSc Computer Science', level: "Bachelor's", duration: '3 years', tuition: 'MYR 34,000 / year' },
        { name: 'BA International Hospitality Management', level: "Bachelor's", duration: '3 years', tuition: 'MYR 32,000 / year' },
        { name: 'MBA', level: "Master's", duration: '1 year', tuition: 'MYR 42,000 total' },
        { name: 'Foundation in Business', level: 'Foundation', duration: '1 year', tuition: 'MYR 22,000 total' },
      ],
    },
  },
  {
    name: 'Sunway University',
    slug: 'sunway-university',
    data: {
      abbr: 'SU',
      country: 'Malaysia',
      city: 'Bandar Sunway, Selangor',
      ownership: 'Private',
      summary: 'Integrated city campus with its own student housing and strong computing and psychology departments.',
      about:
        'Sunway sits inside the Bandar Sunway township, which means accommodation, food, healthcare and transport are all inside a ten-minute walk. The university partners with Lancaster University for several dual-award degrees.',
      tuition_from: 28000,
      currency: 'MYR',
      levels: ["Foundation", "Bachelor's", "Master's"],
      disciplines: ['Computing', 'Psychology', 'Business', 'Biology'],
      ranking: 'QS #539 world',
      founded: '1987',
      featured: true,
      website: 'https://sunwayuniversity.edu.my',
      requirements:
        "Bachelor's: 5 SPM credits or equivalent.\nMaster's: bachelor's degree, CGPA 2.75+.\nEnglish: IELTS 6.0 for most programmes.",
      programs: [
        { name: 'BSc (Hons) Computer Science', level: "Bachelor's", duration: '3 years', tuition: 'MYR 30,000 / year' },
        { name: 'BSc (Hons) Psychology', level: "Bachelor's", duration: '3 years', tuition: 'MYR 28,000 / year' },
        { name: 'MSc Data Science', level: "Master's", duration: '1 year', tuition: 'MYR 38,000 total' },
      ],
    },
  },
  {
    name: 'Asia Pacific University of Technology & Innovation',
    slug: 'asia-pacific-university',
    data: {
      abbr: 'APU',
      country: 'Malaysia',
      city: 'Kuala Lumpur',
      ownership: 'Private',
      summary: 'Technology and computing specialist with one of the largest international student communities in Malaysia.',
      about:
        'APU is built around a technology core — computing, engineering, fintech and cybersecurity — with a deliberately large international cohort. Roughly half the student body comes from outside Malaysia.',
      tuition_from: 24000,
      currency: 'MYR',
      levels: ["Foundation", "Diploma", "Bachelor's", "Master's"],
      disciplines: ['Computing', 'Engineering', 'Business', 'Cybersecurity'],
      ranking: 'QS #5 star teaching',
      founded: '1993',
      featured: true,
      website: 'https://www.apu.edu.my',
      requirements:
        "Bachelor's: 5 SPM credits, or 2 A-Level passes.\nMaster's: bachelor's degree with CGPA 2.5+.\nEnglish: IELTS 5.0–6.0 depending on programme.",
      programs: [
        { name: 'BSc (Hons) Software Engineering', level: "Bachelor's", duration: '3 years', tuition: 'MYR 26,000 / year' },
        { name: 'BSc (Hons) Cybersecurity', level: "Bachelor's", duration: '3 years', tuition: 'MYR 27,000 / year' },
        { name: 'MSc Artificial Intelligence', level: "Master's", duration: '1 year', tuition: 'MYR 36,000 total' },
        { name: 'Diploma in Information Technology', level: 'Diploma', duration: '2 years', tuition: 'MYR 20,000 total' },
      ],
    },
  },
  {
    name: 'Monash University Malaysia',
    slug: 'monash-university-malaysia',
    data: {
      abbr: 'MUM',
      country: 'Malaysia',
      city: 'Bandar Sunway, Selangor',
      ownership: 'Private',
      summary: 'Australian branch campus awarding a Monash degree — identical certificate to the Melbourne campus.',
      about:
        'Monash Malaysia is a full branch campus of Monash University, ranked inside the world top 40. Students graduate with a Monash degree and can transfer to Melbourne after the first year.',
      tuition_from: 34000,
      currency: 'MYR',
      levels: ["Foundation", "Bachelor's"],
      disciplines: ['Engineering', 'Business', 'Computing', 'Pharmacy'],
      ranking: 'QS #37 world',
      founded: '1998',
      featured: true,
      website: 'https://www.monash.edu.my',
      requirements:
        "Bachelor's: A-Levels with 2–3 passes, or a recognised foundation programme.\nEnglish: IELTS 6.5 overall.",
      programs: [
        { name: 'Bachelor of Computer Science', level: "Bachelor's", duration: '3 years', tuition: 'MYR 38,000 / year' },
        { name: 'Bachelor of Business and Commerce', level: "Bachelor's", duration: '3 years', tuition: 'MYR 34,000 / year' },
        { name: 'Bachelor of Engineering (Honours)', level: "Bachelor's", duration: '4 years', tuition: 'MYR 42,000 / year' },
      ],
    },
  },
  {
    name: 'UCSI University',
    slug: 'ucsi-university',
    data: {
      abbr: 'UCSI',
      country: 'Malaysia',
      city: 'Cheras, Kuala Lumpur',
      ownership: 'Private',
      summary: 'Broad health-science and engineering portfolio on a city campus in Kuala Lumpur.',
      about:
        'UCSI has a large health-sciences footprint — medicine, pharmacy, nursing and optometry — alongside engineering and business. Its Kuala Lumpur campus sits directly on the MRT line.',
      tuition_from: 22000,
      currency: 'MYR',
      levels: ["Foundation", "Diploma", "Bachelor's", "Master's"],
      disciplines: ['Health Sciences', 'Engineering', 'Business', 'Pharmacy'],
      ranking: 'QS #265 Asia',
      founded: '1986',
      featured: false,
      website: 'https://www.ucsiuniversity.edu.my',
      requirements: "Bachelor's: 5 SPM credits.\nEnglish: IELTS 5.5–6.0.",
      programs: [
        { name: 'Bachelor of Pharmacy (Hons)', level: "Bachelor's", duration: '4 years', tuition: 'MYR 32,000 / year' },
        { name: 'BEng (Hons) Mechanical Engineering', level: "Bachelor's", duration: '4 years', tuition: 'MYR 26,000 / year' },
        { name: 'Bachelor of Business Administration', level: "Bachelor's", duration: '3 years', tuition: 'MYR 22,000 / year' },
      ],
    },
  },
  {
    name: 'University of Nicosia',
    slug: 'university-of-nicosia',
    data: {
      abbr: 'UNIC',
      country: 'Cyprus',
      city: 'Nicosia',
      ownership: 'Private',
      summary: 'English-taught programmes in the capital, best known for medicine and blockchain research.',
      about:
        'UNIC is the largest university in Cyprus, teaching entirely in English. It runs one of the few EU medical schools that accepts international students directly from secondary school.',
      tuition_from: 9000,
      currency: 'EUR',
      levels: ["Bachelor's", "Master's"],
      disciplines: ['Medicine', 'Business', 'Computing', 'Law'],
      ranking: 'Times #501–600',
      founded: '1980',
      featured: true,
      website: 'https://www.unic.ac.cy',
      requirements: "Bachelor's: high-school diploma with a good average.\nEnglish: IELTS 6.0 or equivalent.",
      programs: [
        { name: 'MD Medicine', level: "Bachelor's", duration: '6 years', tuition: 'EUR 18,000 / year' },
        { name: 'BSc Computer Science', level: "Bachelor's", duration: '4 years', tuition: 'EUR 9,000 / year' },
        { name: 'MSc Blockchain and Digital Currency', level: "Master's", duration: '1 year', tuition: 'EUR 12,000 total' },
      ],
    },
  },
  {
    name: 'Eastern Mediterranean University',
    slug: 'eastern-mediterranean-university',
    data: {
      abbr: 'EMU',
      country: 'Cyprus',
      city: 'Famagusta',
      ownership: 'Public',
      summary: 'State university founded in 1979 with a large English-taught portfolio and low tuition.',
      about:
        'EMU is a state university in Famagusta with around 20,000 students, a substantial share of them international. Tuition is among the lowest in the eastern Mediterranean.',
      tuition_from: 4500,
      currency: 'EUR',
      levels: ["Bachelor's", "Master's"],
      disciplines: ['Engineering', 'Architecture', 'Business', 'Education'],
      ranking: 'Times #801–1000',
      founded: '1979',
      featured: true,
      website: 'https://www.emu.edu.tr',
      requirements: "Bachelor's: high-school diploma.\nEnglish: IELTS 6.0, or pass the in-house English test.",
      programs: [
        { name: 'BSc Civil Engineering', level: "Bachelor's", duration: '4 years', tuition: 'EUR 4,800 / year' },
        { name: 'BArch Architecture', level: "Bachelor's", duration: '4 years', tuition: 'EUR 5,200 / year' },
        { name: 'MBA', level: "Master's", duration: '18 months', tuition: 'EUR 6,500 total' },
      ],
    },
  },
  {
    name: 'Cyprus International University',
    slug: 'cyprus-international-university',
    data: {
      abbr: 'CIU',
      country: 'Cyprus',
      city: 'Nicosia',
      ownership: 'Private',
      summary: 'Budget-friendly English-taught degrees in the capital, popular with first-time applicants.',
      about:
        'CIU offers one of the lowest entry points into an EU-recognised degree, with scholarships routinely awarded on top of published tuition.',
      tuition_from: 3500,
      currency: 'EUR',
      levels: ["Bachelor's", "Master's"],
      disciplines: ['Engineering', 'Health Sciences', 'Business', 'Communication'],
      ranking: 'THE ranked',
      founded: '1997',
      featured: false,
      website: 'https://www.ciu.edu.tr',
      requirements: "Bachelor's: high-school diploma.\nEnglish: IELTS 5.5, or in-house placement test.",
      programs: [
        { name: 'BSc Computer Engineering', level: "Bachelor's", duration: '4 years', tuition: 'EUR 3,600 / year' },
        { name: 'BSc Nursing', level: "Bachelor's", duration: '4 years', tuition: 'EUR 4,200 / year' },
        { name: 'MSc Business Administration', level: "Master's", duration: '2 years', tuition: 'EUR 3,500 total' },
      ],
    },
  },
  {
    name: 'University of Debrecen',
    slug: 'university-of-debrecen',
    data: {
      abbr: 'UD',
      country: 'Hungary',
      city: 'Debrecen',
      ownership: 'Public',
      summary: "Hungary's oldest continuously operating university, with English-taught medicine and engineering.",
      about:
        'Founded in 1538, Debrecen is a public university with a large English-language programme portfolio and living costs well below western Europe. It is a common route into EU degrees for students on a tight budget.',
      tuition_from: 5500,
      currency: 'EUR',
      levels: ["Bachelor's", "Master's", "PhD"],
      disciplines: ['Medicine', 'Engineering', 'Agriculture', 'Science'],
      ranking: 'QS #651–700',
      founded: '1538',
      featured: true,
      website: 'https://edu.unideb.hu',
      requirements: "Bachelor's: high-school diploma with strong science grades.\nEnglish: IELTS 5.5+ or an entrance interview.",
      programs: [
        { name: 'BSc Computer Science Engineering', level: "Bachelor's", duration: '3.5 years', tuition: 'EUR 5,500 / year' },
        { name: 'MSc Data Science', level: "Master's", duration: '2 years', tuition: 'EUR 6,000 / year' },
        { name: 'BSc Civil Engineering', level: "Bachelor's", duration: '3.5 years', tuition: 'EUR 5,500 / year' },
      ],
    },
  },
  {
    name: 'Technical University of Munich',
    slug: 'technical-university-of-munich',
    data: {
      abbr: 'TUM',
      country: 'Germany',
      city: 'Munich',
      ownership: 'Public',
      summary: 'Top-ranked German public university with no tuition fee — you pay a semester contribution only.',
      about:
        'TUM charges no tuition for most programmes; students pay a semester contribution of around EUR 150. Admission is competitive and German language ability is required for most bachelor programmes.',
      tuition_from: 0,
      currency: 'EUR',
      levels: ["Bachelor's", "Master's", "PhD"],
      disciplines: ['Engineering', 'Computing', 'Natural Sciences', 'Medicine'],
      ranking: 'QS #28 world',
      founded: '1868',
      featured: false,
      website: 'https://www.tum.de',
      requirements: "Bachelor's: recognised secondary qualification, usually with German (DSH-2 / TestDaF).\nMaster's: relevant bachelor's degree, often with GRE.",
      programs: [
        { name: 'MSc Informatics', level: "Master's", duration: '2 years', tuition: 'No tuition · EUR 150 semester fee' },
        { name: 'MSc Mechanical Engineering', level: "Master's", duration: '2 years', tuition: 'No tuition · EUR 150 semester fee' },
      ],
    },
  },
  {
    name: 'Coventry University',
    slug: 'coventry-university',
    data: {
      abbr: 'CU',
      country: 'United Kingdom',
      city: 'Coventry',
      ownership: 'Public',
      summary: 'UK public university known for employability-focused degrees and January as well as September intakes.',
      about:
        'Coventry runs a September and a January intake, which matters if you have missed the main cycle. Teaching is strongly vocational, with placement years built into many degrees.',
      tuition_from: 16000,
      currency: 'GBP',
      levels: ["Foundation", "Bachelor's", "Master's"],
      disciplines: ['Business', 'Engineering', 'Computing', 'Health'],
      ranking: 'Guardian top 30',
      founded: '1970',
      featured: true,
      website: 'https://www.coventry.ac.uk',
      requirements: "Bachelor's: A-Levels or a recognised foundation year.\nMaster's: 2:2 honours degree or equivalent.\nEnglish: IELTS 6.0 with no band below 5.5.",
      programs: [
        { name: 'BSc (Hons) Computing', level: "Bachelor's", duration: '3 years', tuition: 'GBP 16,500 / year' },
        { name: 'MSc International Business Management', level: "Master's", duration: '1 year', tuition: 'GBP 18,000 total' },
        { name: 'International Foundation Year', level: 'Foundation', duration: '1 year', tuition: 'GBP 14,000 total' },
      ],
    },
  },
  {
    name: 'University of Wollongong',
    slug: 'university-of-wollongong',
    data: {
      abbr: 'UOW',
      country: 'Australia',
      city: 'Wollongong, New South Wales',
      ownership: 'Public',
      summary: 'Coastal Australian public university, an hour from Sydney, strong in engineering and IT.',
      about:
        'UOW is ranked in the world top 200 and sits on the New South Wales coast south of Sydney, which keeps living costs noticeably below the capital.',
      tuition_from: 32000,
      currency: 'AUD',
      levels: ["Foundation", "Bachelor's", "Master's"],
      disciplines: ['Engineering', 'Computing', 'Business', 'Health'],
      ranking: 'QS #167 world',
      founded: '1975',
      featured: false,
      website: 'https://www.uow.edu.au',
      requirements: "Bachelor's: recognised secondary qualification.\nMaster's: bachelor's degree.\nEnglish: IELTS 6.5.",
      programs: [
        { name: 'Bachelor of Computer Science', level: "Bachelor's", duration: '3 years', tuition: 'AUD 34,000 / year' },
        { name: 'Master of Engineering', level: "Master's", duration: '2 years', tuition: 'AUD 38,000 / year' },
      ],
    },
  },
]

const SCHOLARSHIPS = [
  {
    name: 'ISC Merit Award',
    slug: 'isc-merit-award',
    data: {
      provider: 'International Study Council',
      provider_type: 'Independent provider',
      award_type: 'Tuition waiver',
      amount: '25% of first-year tuition',
      deadline: '2027-03-31',
      levels: ["Bachelor's", "Master's"],
      countries: ['Malaysia', 'Cyprus', 'Hungary'],
      disciplines: ['Any'],
      eligibility:
        'Awarded to applicants we place who hold an offer with a final grade average of 80% or above. Assessed automatically — no separate form.',
      apply_url: '/contact',
      featured: true,
      summary: 'Automatic tuition waiver for high-achieving students we place in Malaysia, Cyprus or Hungary.',
    },
  },
  {
    name: 'Early Application Grant',
    slug: 'early-application-grant',
    data: {
      provider: 'International Study Council',
      provider_type: 'Independent provider',
      award_type: 'Grant',
      amount: 'USD 500',
      deadline: '2027-01-15',
      levels: ["Foundation", "Bachelor's", "Master's"],
      countries: ['Any'],
      disciplines: ['Any'],
      eligibility:
        'Open to students who submit a complete application file through ISC at least four months before the intake starts.',
      apply_url: '/contact',
      featured: true,
      summary: 'A flat USD 500 grant for students who complete their application file early.',
    },
  },
  {
    name: 'Chevening Scholarships',
    slug: 'chevening-scholarships',
    data: {
      provider: 'UK Government (FCDO)',
      provider_type: 'Government',
      award_type: 'Full funding',
      amount: 'Tuition + stipend + flights',
      deadline: '2026-11-05',
      levels: ["Master's"],
      countries: ['United Kingdom'],
      disciplines: ['Any'],
      eligibility:
        "Citizens of a Chevening-eligible country, with at least two years of work experience and an unconditional offer from a UK university by the July deadline. Requires IELTS 6.5+ and a return-home commitment of two years.",
      apply_url: 'https://www.chevening.org',
      featured: true,
      summary: 'Fully funded UK master’s degree for future leaders, covering tuition, living costs and flights.',
    },
  },
  {
    name: 'Erasmus Mundus Joint Masters',
    slug: 'erasmus-mundus-joint-masters',
    data: {
      provider: 'European Commission',
      provider_type: 'Government',
      award_type: 'Full funding',
      amount: 'EUR 1,400 / month + tuition',
      deadline: '2027-01-20',
      levels: ["Master's"],
      countries: ['European Union'],
      disciplines: ['Any'],
      eligibility:
        'Open to students of any nationality applying to an Erasmus Mundus Joint Master programme. You apply to the consortium directly, and can list up to three programmes.',
      apply_url: 'https://www.eacea.ec.europa.eu',
      featured: true,
      summary: 'Study in two or more European countries on a fully funded joint master’s degree.',
    },
  },
  {
    name: 'DAAD Study Scholarships',
    slug: 'daad-study-scholarships',
    data: {
      provider: 'DAAD',
      provider_type: 'Government',
      award_type: 'Monthly stipend',
      amount: 'EUR 992 / month',
      deadline: '2026-12-01',
      levels: ["Master's", 'PhD'],
      countries: ['Germany'],
      disciplines: ['Engineering', 'Science', 'Social Sciences', 'Arts'],
      eligibility:
        "Graduates with a first degree completed within the last six years. German language ability is required for most programmes; some are taught in English.",
      apply_url: 'https://www.daad.de',
      featured: false,
      summary: 'German government stipend for master’s and doctoral study in Germany.',
    },
  },
  {
    name: 'Australia Awards',
    slug: 'australia-awards',
    data: {
      provider: 'Australian Government',
      provider_type: 'Government',
      award_type: 'Full funding',
      amount: 'Tuition + living + insurance',
      deadline: '2027-04-30',
      levels: ["Bachelor's", "Master's"],
      countries: ['Australia'],
      disciplines: ['Development', 'Health', 'Education', 'Engineering'],
      eligibility:
        'Citizens of a participating country applying to a priority development field. Requires a minimum of two years of relevant work experience.',
      apply_url: 'https://www.dfat.gov.au',
      featured: false,
      summary: 'Fully funded Australian degrees for students from participating countries.',
    },
  },
  {
    name: 'University of Nicosia Merit Scholarship',
    slug: 'university-of-nicosia-merit-scholarship',
    data: {
      provider: 'University of Nicosia',
      provider_type: 'University',
      award_type: 'Tuition waiver',
      amount: '20–50% of tuition',
      deadline: '',
      levels: ["Bachelor's", "Master's"],
      countries: ['Cyprus'],
      disciplines: ['Any'],
      eligibility:
        'Assessed with your admission application. Percentage depends on your final secondary-school average and any prior degree results.',
      apply_url: 'https://www.unic.ac.cy',
      featured: false,
      summary: 'Automatic tuition discount of 20–50% assessed with your UNIC admission file.',
    },
  },
  {
    name: 'Monash Malaysia High Achiever Award',
    slug: 'monash-malaysia-high-achiever-award',
    data: {
      provider: 'Monash University Malaysia',
      provider_type: 'University',
      award_type: 'Tuition waiver',
      amount: 'Up to 30% of tuition',
      deadline: '2027-02-28',
      levels: ["Bachelor's"],
      countries: ['Malaysia'],
      disciplines: ['Any'],
      eligibility:
        'For students entering a Monash Malaysia bachelor’s degree with outstanding A-Level or foundation results. No separate application — you are assessed on admission.',
      apply_url: 'https://www.monash.edu.my',
      featured: false,
      summary: 'Up to 30% tuition waiver for high-achieving bachelor’s entrants at Monash Malaysia.',
    },
  },
]

const SERVICES = [
  {
    title: 'Free Profile Assessment',
    slug: 'free-profile-assessment',
    data: {
      category: 'Getting started',
      tag: 'Included',
      outcome: 'A written read on where you stand',
      summary: 'A 30-minute call and a written read on which destinations and budgets are realistic for you.',
      body: 'We look at your transcripts, English level, budget and timeline, and tell you plainly which countries you can realistically get into and afford. You leave with a written summary even if you never use us again.',
      price: 'Free',
      price_value: 0,
      duration_weeks: 1,
      duration: '30 minutes',
      includes: ['Transcript review', 'Budget planning', 'Destination shortlist', 'Written summary'],
    },
  },
  {
    title: 'Career Counselling & Planning',
    slug: 'career-counselling-planning',
    data: {
      category: 'Getting started',
      tag: 'Stage 0',
      outcome: 'A five-year plan you actually believe in',
      summary: 'Work out what you want to do before you choose what to study — and which degree actually gets you there.',
      body: "Most students pick a degree first and a career second, then spend three years discovering the mismatch. We do it the other way round.\n\nWe start from what you are good at and what you want your life to look like at 30, then work backwards to the qualification, the country and the intake that gets you there. Where the honest answer is that a degree is not the right next step, we will say so.\n\n## What we cover\n\n- Aptitude and interest mapping, not a personality quiz\n- Which careers actually exist in your target country, and what they pay\n- Whether a bachelors, a diploma or a certification is the right entry point\n- Realistic pathways for career changers and mature students",
      price: 'USD 90',
      price_value: 90,
      duration_weeks: 2,
      duration: '2 sessions',
      includes: ['Two 60-minute sessions', 'Aptitude and interest mapping', 'Career and salary research', 'Five-year written plan'],
    },
  },
  {
    title: 'University & Course Matching',
    slug: 'university-course-matching',
    data: {
      category: 'Getting started',
      tag: 'Stage 1',
      outcome: 'A shortlist you can compare on numbers',
      summary: 'A written shortlist of 5–8 programmes with total cost of attendance and admission probability.',
      body: 'We compare programmes on the numbers that matter — total tuition across the whole degree, living costs, scholarship eligibility, visa financial requirement and how your grades compare to the last intake. Commission, where it exists, is disclosed on the shortlist.',
      price: 'From USD 150',
      price_value: 150,
      duration_weeks: 2,
      duration: '1–2 weeks',
      includes: ['5–8 programme shortlist', 'Total cost of attendance', 'Scholarship eligibility', 'Commission disclosure'],
    },
  },
  {
    title: 'Statement of Purpose (SOP)',
    slug: 'statement-of-purpose',
    data: {
      category: 'Applications & documents',
      tag: 'Stage 2',
      outcome: 'A submission-ready statement in your own voice',
      summary: 'Drafted with you, not for you — then edited line by line until it sounds like a person wrote it.',
      body: "Admissions officers read hundreds of statements and almost all of them say the same three things. We work from your material, not a template, and the goal is a statement that answers the question the officer is actually asking.\n\n## How the process runs\n\n1. A 45-minute interview where we extract the material — the specific moments, the problems you could not solve, the reason this programme and not another.\n2. A structural draft that we write with you.\n3. Two rounds of line editing with tracked changes.\n4. A final plagiarism and AI-detection check before you submit.\n\nWe also prepare the shorter supporting statements — motivation letters, diversity statements, and the 500-word 'why this university' answers.",
      price: 'From USD 120',
      price_value: 120,
      duration_weeks: 2,
      duration: '1–2 weeks',
      includes: ['Extraction interview', 'Full draft', 'Two revision rounds', 'Plagiarism and AI check'],
    },
  },
  {
    title: 'CV & Résumé Writing',
    slug: 'cv-resume-writing',
    data: {
      category: 'Applications & documents',
      tag: 'Stage 2',
      outcome: 'An academic CV and a work résumé, both ATS-safe',
      summary: 'Two documents, because a university and an employer want different things from the same life.',
      body: "A university wants to see academic trajectory, research exposure and fit for the programme. An employer wants impact, numbers and outcomes. One document cannot do both.\n\nWe produce both, in the format each audience expects, and make sure they survive automated screening.\n\n## What we do\n\n- Rewrite your experience in outcome language rather than duty language\n- Format to the academic conventions of your target country\n- Build a clean, ATS-parsable layout — no tables, no columns, no graphics\n- Prepare a matching LinkedIn profile summary so the two agree with each other",
      price: 'USD 80',
      price_value: 80,
      duration_weeks: 1,
      duration: '5 days',
      includes: ['Academic CV', 'Work résumé', 'ATS-safe formatting', 'LinkedIn summary'],
    },
  },
  {
    title: 'Application Submission',
    slug: 'application-submission',
    data: {
      category: 'Applications & documents',
      tag: 'Stage 2',
      outcome: 'Every application filed, tracked and acknowledged',
      summary: 'We complete the portals, upload the documents, pay the fees and chase every acknowledgement.',
      body: "Most rejections that are not about grades are about paperwork — a transcript uploaded in the wrong format, a reference request sent to a spam folder, an application fee that never cleared.\n\nWe run the submission itself. You keep the login, you see everything we file, and you get a status board that shows exactly what is outstanding and who is holding it up.\n\n## What we handle\n\n- Portal creation and completion for each university\n- Document formatting, translation coordination and certified-copy arrangements\n- Reference requests, with reminders sent on your behalf\n- Application fee payment (fees are passed through at cost)\n- Tracking every acknowledgement and following up when one is missing",
      price: 'From USD 300',
      price_value: 300,
      duration_weeks: 6,
      duration: '3–6 weeks',
      includes: ['Portal completion', 'Document upload and formatting', 'Reference chasing', 'Offer tracking board'],
    },
  },
  {
    title: 'Scholarship & Funding Guidance',
    slug: 'scholarship-funding-guidance',
    data: {
      category: 'Funding',
      tag: 'Stage 2',
      outcome: 'Every award you actually qualify for, filed',
      summary: 'We map the awards you genuinely qualify for, and file the ones that need separate applications.',
      body: 'Most students miss funding because they only look at university pages. We track government schemes, consortium programmes and early-application grants alongside the automatic merit awards that come with your admission file.',
      price: 'From USD 200',
      price_value: 200,
      duration_weeks: 4,
      duration: '2–4 weeks',
      includes: ['Eligibility screening', 'Deadline calendar', 'Separate application filing', 'Interview preparation'],
    },
  },
  {
    title: 'IELTS & English Test Preparation',
    slug: 'ielts-preparation',
    data: {
      category: 'English & career',
      tag: 'Add-on',
      outcome: 'The band score your programme actually needs',
      summary: 'Small-group or one-to-one preparation aimed at the specific score your target programme requires.',
      body: "Generic IELTS courses teach to a generic band. You need a specific number for a specific programme, and usually a minimum in one particular skill.\n\nWe start from your diagnostic, work out which band each section needs to reach, and build the sessions around closing that gap.\n\n## Format\n\n- Twelve sessions, small group (maximum six) or one-to-one\n- Two full mock tests under exam conditions, marked with written feedback\n- Speaking practice recorded and reviewed\n- We also prepare students for PTE, TOEFL and Duolingo where a university accepts them",
      price: 'From USD 180',
      price_value: 180,
      duration_weeks: 8,
      duration: '6–8 weeks',
      includes: ['Diagnostic test', '12 sessions', 'Two marked mock tests', 'Speaking recordings'],
    },
  },
  {
    title: 'Visa Application',
    slug: 'visa-application',
    data: {
      category: 'Visa & travel',
      tag: 'Stage 3',
      outcome: 'A complete, compliant visa file',
      summary: 'The full visa file, built to the embassy specification, plus a mock interview before the real one.',
      body: "This is where applications are won and lost. The financial evidence requirement is set by the government, not the university, and it changes every year.\n\nWe build the file to the exact specification for your destination — seasoned funds, correct account types, documented sponsors — and we do not submit until it is right. Then we run you through the interview questions until you are bored of them.\n\n## Included\n\n- Document file built to the current embassy checklist\n- Financial evidence review (seasoning period, account type, sponsor documentation)\n- Appointment booking and fee payment guidance\n- Two mock interviews with written feedback\n- Support if there is a refusal and you want to reapply",
      price: 'From USD 250',
      price_value: 250,
      duration_weeks: 4,
      duration: '2–4 weeks',
      includes: ['Document file build', 'Financial evidence check', 'Two mock interviews', 'Appointment booking'],
    },
  },
  {
    title: 'Pre-Departure Support',
    slug: 'pre-departure-support',
    data: {
      category: 'Visa & travel',
      tag: 'Stage 4',
      outcome: 'You land knowing where your keys are',
      summary: 'Accommodation, insurance, banking, airport pickup and a briefing before you fly.',
      body: "The week before departure is when students get scammed. Fake landlords, unlicensed agents, accommodation that does not exist.\n\nWe help you choose accommodation you can actually afford from a vetted list, set up the practicalities before you land, and put you in a group with other students heading to the same city.\n\n## What we arrange\n\n- Accommodation shortlist with verified landlords or university halls\n- Student insurance, bank account and SIM card set up in advance\n- Airport pickup coordination for arrival day\n- Pre-departure briefing covering money, safety, culture and what to pack\n- A group chat with your cohort so nobody arrives alone",
      price: 'From USD 100',
      price_value: 100,
      duration_weeks: 3,
      duration: '2–3 weeks',
      includes: ['Vetted accommodation list', 'Insurance and banking', 'Airport pickup', 'Pre-departure briefing'],
    },
  },
]

const COUNTRIES = [
  {
    name: 'Malaysia',
    slug: 'malaysia',
    data: {
      flag: '🇲🇾',
      iso: 'MY',
      map_status: 'Live',
      intro:
        'English-taught degrees, low tuition and a large international student community. The most affordable route to a UK or Australian qualification.',
      tuition_from: 12000,
      currency: 'MYR',
      living_cost: 'MYR 1,500–2,500 / month',
      intakes: 'January, May, September',
      visa: 'EMGS student pass. Financial proof of roughly one year of tuition plus living costs.',
      popular_for: ['Business', 'Computing', 'Hospitality', 'Engineering'],
      featured: true,
    },
  },
  {
    name: 'Cyprus',
    slug: 'cyprus',
    data: {
      flag: '🇨🇾',
      iso: 'CY',
      map_status: 'Live',
      intro: 'EU-recognised degrees at the lowest tuition in Europe, with a straightforward student visa process.',
      tuition_from: 3500,
      currency: 'EUR',
      living_cost: 'EUR 400–700 / month',
      intakes: 'February, September',
      visa: 'Student visa via the embassy. Requires an acceptance letter and proof of funds.',
      popular_for: ['Medicine', 'Engineering', 'Business', 'Architecture'],
      featured: true,
    },
  },
  {
    name: 'Hungary',
    slug: 'hungary',
    data: {
      flag: '🇭🇺',
      iso: 'HU',
      map_status: 'Live',
      intro: 'Schengen access, EU degrees and living costs well below western Europe. Strong in medicine and engineering.',
      tuition_from: 5500,
      currency: 'EUR',
      living_cost: 'EUR 450–750 / month',
      intakes: 'February, September',
      visa: 'Schengen residence permit for study. Requires an entrance interview at most universities.',
      popular_for: ['Medicine', 'Engineering', 'Agriculture', 'Science'],
      featured: true,
    },
  },
  {
    name: 'Germany',
    slug: 'germany',
    data: {
      flag: '🇩🇪',
      iso: 'DE',
      map_status: 'Live',
      intro: 'No tuition at public universities — you pay a semester contribution only. Competitive, and mostly requires German.',
      tuition_from: 0,
      currency: 'EUR',
      living_cost: 'EUR 900–1,200 / month',
      intakes: 'April, October',
      visa: 'National student visa. Blocked account of about EUR 12,000 required.',
      popular_for: ['Engineering', 'Computing', 'Natural Sciences', 'Philosophy'],
      featured: true,
    },
  },
  {
    name: 'United Kingdom',
    slug: 'united-kingdom',
    data: {
      flag: '🇬🇧',
      iso: 'GB',
      map_status: 'Live',
      intro: 'Three-year bachelor’s degrees, one-year master’s, and a two-year post-study work visa.',
      tuition_from: 14000,
      currency: 'GBP',
      living_cost: 'GBP 900–1,400 / month',
      intakes: 'September, January',
      visa: 'Student route visa. Requires a CAS, IELTS for UKVI and 9 months of living costs in funds.',
      popular_for: ['Business', 'Law', 'Computing', 'Health'],
      featured: true,
    },
  },
  {
    name: 'Australia',
    slug: 'australia',
    data: {
      flag: '🇦🇺',
      iso: 'AU',
      map_status: 'Live',
      intro: 'Strong post-study work rights and a large international student network, at a higher price point.',
      tuition_from: 32000,
      currency: 'AUD',
      living_cost: 'AUD 2,000–2,800 / month',
      intakes: 'February, July, November',
      visa: 'Subclass 500. Requires a Confirmation of Enrolment and financial capacity evidence.',
      popular_for: ['Engineering', 'Health', 'Business', 'Environmental Science'],
      featured: true,
    },
  },
  {
    name: 'Canada',
    slug: 'canada',
    data: {
      flag: '🇨🇦',
      iso: 'CA',
      map_status: 'In progress',
      intro: 'Post-graduation work permits and a clear route to permanent residence. Applications open for the 2027 intakes.',
      tuition_from: 18000,
      currency: 'CAD',
      living_cost: 'CAD 1,200–1,800 / month',
      intakes: 'January, September',
      visa: 'Study permit plus a provincial attestation letter. Proof of funds for one year required.',
      popular_for: ['Computing', 'Business', 'Health', 'Engineering'],
      featured: true,
    },
  },
  {
    name: 'Ireland',
    slug: 'ireland',
    data: {
      flag: '🇮🇪',
      iso: 'IE',
      map_status: 'In progress',
      intro: 'English-speaking EU member with a two-year stay-back permission for master’s graduates.',
      tuition_from: 12000,
      currency: 'EUR',
      living_cost: 'EUR 900–1,400 / month',
      intakes: 'September, January',
      visa: 'Stamp 2 study permission. Requires evidence of EUR 10,000 in funds.',
      popular_for: ['Computing', 'Pharmacy', 'Business', 'Data Science'],
      featured: false,
    },
  },
  {
    name: 'Netherlands',
    slug: 'netherlands',
    data: {
      flag: '🇳🇱',
      iso: 'NL',
      map_status: 'In progress',
      intro: 'Most master’s programmes are taught entirely in English, with a one-year post-study orientation year.',
      tuition_from: 8000,
      currency: 'EUR',
      living_cost: 'EUR 900–1,300 / month',
      intakes: 'September, February',
      visa: 'MVV and residence permit arranged by the university. Requires proof of funds.',
      popular_for: ['Engineering', 'Business', 'Law', 'Agriculture'],
      featured: false,
    },
  },
  {
    name: 'Poland',
    slug: 'poland',
    data: {
      flag: '🇵🇱',
      iso: 'PL',
      map_status: 'In progress',
      intro: 'Low tuition and living costs inside the Schengen area, with a growing English-taught portfolio.',
      tuition_from: 3000,
      currency: 'EUR',
      living_cost: 'EUR 450–750 / month',
      intakes: 'October, February',
      visa: 'National D-type visa then a temporary residence permit. Proof of funds required.',
      popular_for: ['Medicine', 'Computing', 'Engineering', 'Business'],
      featured: false,
    },
  },
  {
    name: 'United Arab Emirates',
    slug: 'united-arab-emirates',
    data: {
      flag: '🇦🇪',
      iso: 'AE',
      map_status: 'In progress',
      intro: 'International branch campuses of UK, Australian and Indian universities, with no income tax.',
      tuition_from: 40000,
      currency: 'AED',
      living_cost: 'AED 3,000–5,000 / month',
      intakes: 'September, January',
      visa: 'Student residence visa sponsored by the university. Medical test on arrival.',
      popular_for: ['Business', 'Engineering', 'Computing', 'Hospitality'],
      featured: false,
    },
  },
  {
    name: 'Singapore',
    slug: 'singapore',
    data: {
      flag: '🇸🇬',
      iso: 'SG',
      map_status: 'In progress',
      intro: 'Two world-ranked public universities and a strong regional job market for graduates.',
      tuition_from: 20000,
      currency: 'SGD',
      living_cost: 'SGD 1,500–2,500 / month',
      intakes: 'August, January',
      visa: 'Student’s Pass via the ICA. Requires an offer letter and financial evidence.',
      popular_for: ['Computing', 'Business', 'Engineering', 'Finance'],
      featured: false,
    },
  },
  {
    name: 'Japan',
    slug: 'japan',
    data: {
      flag: '🇯🇵',
      iso: 'JP',
      map_status: 'In progress',
      intro: 'Low public tuition, generous MEXT scholarships and a growing number of English-taught degrees.',
      tuition_from: 5000,
      currency: 'USD',
      living_cost: 'JPY 80,000–140,000 / month',
      intakes: 'April, September',
      visa: 'Certificate of Eligibility then a student visa. Proof of funds required.',
      popular_for: ['Engineering', 'Computing', 'Japanese Studies', 'Design'],
      featured: false,
    },
  },
  {
    name: 'South Korea',
    slug: 'south-korea',
    data: {
      flag: '🇰🇷',
      iso: 'KR',
      map_status: 'In progress',
      intro: 'Strong scholarship culture and a fast-growing English-taught offering in technology and business.',
      tuition_from: 6000,
      currency: 'USD',
      living_cost: 'KRW 600,000–1,000,000 / month',
      intakes: 'March, September',
      visa: 'D-2 student visa. Requires an admission certificate and proof of funds.',
      popular_for: ['Engineering', 'Business', 'Media', 'Computing'],
      featured: false,
    },
  },
]

const ADVISORS = [
  {
    title: 'Md. Arif Hossain',
    slug: 'arif-hossain',
    data: {
      role: 'Managing Director',
      bio: 'Fifteen years in international admissions, previously regional manager for two Malaysian universities. Handles profile assessments personally.',
      email: 'arif@internationalstudycouncil.com',
      linkedin: 'https://www.linkedin.com/in/example',
      focus: 'Malaysia · Cyprus · Profile assessment',
      photo: '',
    },
  },
  {
    title: 'Nusrat Jahan',
    slug: 'nusrat-jahan',
    data: {
      role: 'Senior Admissions Counsellor',
      bio: 'Specialises in European public universities and scholarship applications. Has filed more than 400 Erasmus and DAAD applications.',
      email: 'nusrat@internationalstudycouncil.com',
      linkedin: 'https://www.linkedin.com/in/example',
      focus: 'Germany · Hungary · Scholarships',
      photo: '',
    },
  },
  {
    title: 'Tanvir Ahmed',
    slug: 'tanvir-ahmed',
    data: {
      role: 'Visa & Compliance Lead',
      bio: 'Former visa documentation officer. Builds financial evidence files and runs the mock interviews.',
      email: 'tanvir@internationalstudycouncil.com',
      linkedin: 'https://www.linkedin.com/in/example',
      focus: 'UK · Australia · Visa files',
      photo: '',
    },
  },
]

const POSTS = [
  {
    title: 'What a student visa actually costs in 2027',
    slug: 'student-visa-costs-2027',
    data: {
      excerpt: 'Tuition is the number everyone quotes. The number that decides whether you can go is the financial evidence requirement.',
      tags: ['Visas', 'Budgeting'],
      read_minutes: 7,
      published_at: '2026-09-18',
      body: 'Every country asks you to *prove* you can pay, not just say it. The figure is set by the government, not the university, and it changes every year.\n\n## Why the requirement is higher than tuition\n\nAn embassy wants to see that you can cover tuition **and** living costs for the first year, held in an acceptable form for a set number of months. In the UK that is 28 consecutive days. In Germany it is a blocked account. In Malaysia it is usually a bank statement plus a sponsor letter.\n\n## The three mistakes we see\n\n- Money arriving too late — the funds must be seasoned before you apply, not on the day.\n- The wrong account type — a fixed deposit that cannot be released does not count.\n- An undeclared sponsor — if a relative is paying, their relationship must be documented.\n\n## What to do now\n\nWork backwards from your intake date. If you are applying for September, the funds need to be sitting still by June. Build that into your plan before you shortlist universities, not after.',
    },
  },
  {
    title: 'Malaysia vs Cyprus: an honest comparison',
    slug: 'malaysia-vs-cyprus',
    data: {
      excerpt: 'Both are cheap. They are cheap for completely different reasons, and that changes who should pick which.',
      tags: ['Destinations', 'Budgeting'],
      read_minutes: 6,
      published_at: '2026-08-30',
      body: 'These are the two destinations we recommend most often to students on a tight budget, and they are not interchangeable.\n\n## Malaysia\n\nTuition runs from about MYR 12,000 a year. Degrees are taught in English, the country is safe and the infrastructure is good. The catch is that a Malaysian degree carries less weight if you plan to work in Europe afterwards.\n\n## Cyprus\n\nTuition starts around EUR 3,500 and the degree is EU-recognised, which matters for further study or work inside Europe. Living costs are lower than you would expect, but the job market for students is small.\n\n## How to choose\n\nAsk yourself one question: **do you intend to stay in Europe afterwards?** If yes, Cyprus. If you plan to return home or work in Asia, Malaysia gives you more for the same money.',
    },
  },
  {
    title: 'How to write a statement of purpose that is not generic',
    slug: 'statement-of-purpose-guide',
    data: {
      excerpt: 'Admissions officers read hundreds of these. Almost all of them say the same three things. Here is what to do instead.',
      tags: ['Applications', 'Writing'],
      read_minutes: 9,
      published_at: '2026-08-12',
      body: 'Most statements fail for the same reason: they describe the programme back to the person who wrote it.\n\n## Start with a specific moment\n\nNot "I have always been passionate about computer science." Instead: the afternoon you fixed something, or the problem you could not solve and why it bothered you.\n\n## Name the programme, not the university\n\n"I want to study at your university" says nothing. "I want to take the distributed systems module because my internship exposed me to consensus problems I could not reason about" says a great deal.\n\n## Be honest about the gap\n\nIf your grades dipped in one year, address it in one sentence and move on. Silence reads as evasion.\n\n## End with a plan, not a dream\n\n"After graduating I intend to work in X" is stronger than "I hope to contribute to society."',
    },
  },
]

/* -------------------------------------------------------------------------- */

async function isEmpty(table: string): Promise<boolean> {
  const res = await raw(`select count(*)::int as n from ${table}`)
  return Number((res.rows[0] as Row)?.n ?? 0) === 0
}

export async function seed(): Promise<void> {
  if (await isEmpty('pages')) {
    for (const page of PAGES) {
      const inserted = await raw(
        `insert into pages (slug, title, seo_title, seo_description, status, show_in_nav, nav_label, nav_order)
         values ($1,$2,$3,$4,'published',$5,$6,$7) returning id`,
        [
          page.slug,
          page.title,
          page.seo_title,
          page.seo_description,
          page.show_in_nav,
          page.nav_label || page.title,
          page.nav_order,
        ],
      )
      const pageId = Number((inserted.rows[0] as Row).id)
      let position = 0
      for (const block of page.blocks) {
        await raw(
          `insert into blocks (id, page_id, type, position, enabled, data) values ($1,$2,$3,$4,true,$5::jsonb)`,
          [id('blk'), pageId, block.type, position++, JSON.stringify(block.data)],
        )
      }
    }
  }

  if (await isEmpty('settings')) {
    for (const [key, value] of Object.entries(SETTINGS)) {
      await raw(`insert into settings (key, value) values ($1,$2::jsonb)`, [key, JSON.stringify(value)])
    }
  }

  // Every collection stores its display name in `title`; the seeded source
  // arrays use their own natural key (name / title), so normalise here.
  const named = (rows: Array<{ name: string; slug: string; data: Record<string, any> }>) =>
    rows.map((row) => ({ title: row.name, slug: row.slug, data: row.data }))

  const collections: Array<[string, Array<{ title: string; slug: string; data: Record<string, any> }>]> = [
    ['universities', named(UNIVERSITIES)],
    ['scholarships', named(SCHOLARSHIPS)],
    ['services', SERVICES],
    ['countries', named(COUNTRIES)],
    ['advisors', ADVISORS],
    ['posts', POSTS],
  ]

  for (const [collection, items] of collections) {
    const res = await raw(`select count(*)::int as n from entries where collection = $1`, [collection])
    if (Number((res.rows[0] as Row)?.n ?? 0) > 0) continue
    let position = 0
    for (const item of items) {
      await raw(
        `insert into entries (id, collection, slug, title, status, position, data)
         values ($1,$2,$3,$4,'published',$5,$6::jsonb)
         on conflict do nothing`,
        [id('ent'), collection, item.slug, item.title, position++, JSON.stringify(item.data)],
      )
    }
  }


  // Seed the built-in interface translations so the owner sees real text in
  // Admin → Languages rather than empty boxes, and can edit any of it.
  if (await isEmpty('translations')) {
    for (const locale of Object.keys(DICTIONARY) as Array<keyof typeof DICTIONARY>) {
      const table = DICTIONARY[locale]
      for (const key of Object.keys(table)) {
        const value = table[key]
        if (!value) continue
        await raw(
          `insert into translations (locale, key, value) values ($1,$2,$3) on conflict do nothing`,
          [locale, key, value],
        )
      }
    }
  }

  if (await isEmpty('users')) {
    const { hashPassword } = await import('./auth')
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@internationalstudycouncil.com'
    const password = process.env.SEED_ADMIN_PASSWORD || 'changeme123'
    await raw(`insert into users (email, password_hash, name, role) values ($1,$2,$3,'owner')`, [
      email.toLowerCase(),
      hashPassword(password),
      'Site owner',
    ])
  }
}
