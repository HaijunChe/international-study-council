'use client'

import { useEffect } from 'react'

/** Progressive enhancement: fade sections in as they enter the viewport. */
export default function Reveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('main .sec, main .blk-hero'))
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )

    nodes.forEach((node, index) => {
      // Leave the first section alone so the page never appears empty.
      if (index === 0) return
      node.setAttribute('data-reveal', '')
      observer.observe(node)
    })

    return () => observer.disconnect()
  }, [])

  return null
}
