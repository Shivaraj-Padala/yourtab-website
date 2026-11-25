import { useLayoutEffect } from 'react'

const REVEALS = '.reveal, .reveal-head, .reveal-open, .reveal-zoom, .flow, .final-card'
const LOOPS = '.tile, .mock, .face-panel'

/**
 * Sections rise into place once as they come into view (styles/motion.css).
 * Runs before the first paint after hydration: anything already on screen (or above it) is marked
 * shown straight away, so nothing blinks out and back in. Without JS nothing is ever hidden.
 * Also pauses looping animations while they're off screen.
 */
export function useReveal() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const observers: IntersectionObserver[] = []

    // looping animations: only while visible
    const loops = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.toggleAttribute('data-offscreen', !e.isIntersecting)
    })
    document.querySelectorAll(LOOPS).forEach((el) => loops.observe(el))
    observers.push(loops)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const show = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            e.target.classList.add('is-in')
            show.unobserve(e.target)
          }
        },
        { rootMargin: '0px 0px -12% 0px' },
      )
      const fold = window.innerHeight * 0.9
      document.querySelectorAll(REVEALS).forEach((el) => {
        if (el.getBoundingClientRect().top < fold) el.classList.add('is-in')
        else show.observe(el)
      })
      root.classList.add('motion-on')
      observers.push(show)
    }

    return () => {
      observers.forEach((o) => o.disconnect())
      root.classList.remove('motion-on')
    }
  }, [])
}
