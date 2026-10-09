/**
 * Kernel · micro markdown
 * ---------------------------------------------------------------------------
 * Just enough markdown for editorial copy: headings, bold, italic, inline
 * code, links, bullet lists and paragraphs. No dependency, no raw HTML.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
      const safe = /^(https?:|\/|mailto:|tel:)/i.test(href) ? href : '#'
      return `<a href="${safe}">${label}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function markdown(source: unknown): string {
  const raw = String(source ?? '').replace(/\r\n/g, '\n').trim()
  if (!raw) return ''

  const blocks = raw.split(/\n{2,}/)
  const out: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    const first = lines[0] || ''

    if (/^###\s+/.test(first)) {
      out.push(`<h4>${inline(first.replace(/^###\s+/, ''))}</h4>`)
      if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(' '))}</p>`)
      continue
    }
    if (/^##\s+/.test(first)) {
      out.push(`<h3>${inline(first.replace(/^##\s+/, ''))}</h3>`)
      if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(' '))}</p>`)
      continue
    }
    if (/^#\s+/.test(first)) {
      out.push(`<h3>${inline(first.replace(/^#\s+/, ''))}</h3>`)
      if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(' '))}</p>`)
      continue
    }
    if (/^[-*]\s+/.test(first)) {
      const items = lines
        .filter((l) => /^[-*]\s+/.test(l))
        .map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`)
        .join('')
      out.push(`<ul>${items}</ul>`)
      continue
    }
    if (/^\d+\.\s+/.test(first)) {
      const items = lines
        .filter((l) => /^\d+\.\s+/.test(l))
        .map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`)
        .join('')
      out.push(`<ol>${items}</ol>`)
      continue
    }
    out.push(`<p>${inline(lines.join(' '))}</p>`)
  }

  return out.join('\n')
}

/** Plain-text version, for meta descriptions and previews. */
export function plain(source: unknown, limit = 200): string {
  const text = String(source ?? '')
    .replace(/[#*`>\-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
}
