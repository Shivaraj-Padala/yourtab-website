import { useEffect, useState } from 'react'

/** True when the visitor asked for less motion. False during prerender and first paint. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

/**
 * The current time, refreshed every minute. Starts as null so the prerendered HTML and the
 * first client render match; callers show a fixed placeholder until it arrives.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    let timer = 0
    const tick = () => {
      const d = new Date()
      setNow(d)
      timer = window.setTimeout(tick, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50)
    }
    tick()
    return () => clearTimeout(timer)
  }, [])
  return now
}

export const formatTime = (d: Date | null) =>
  d ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '09:41'

export const formatDate = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Tuesday, November 24'
