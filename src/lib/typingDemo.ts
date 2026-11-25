// Types a little script into a search bar, launching a flying key for every keystroke, the way
// the extension does when you type. Used by the "You'll love typing" tile, the Face tile and the
// playground (with the Face on, the keys go to its mouth).
import { useEffect, useRef, type RefObject } from 'react'
import { MOUTHS } from './face'
import { keyLabel, launchKey, type Point } from './flyingKeys'

interface Demo {
  active: boolean
  /** typed one after another, each ending with Enter; '\b' is a Backspace */
  script: string[]
  layer: RefObject<HTMLElement | null>
  /** where a key launches from with `text` in the bar (layer coordinates) */
  caret: (text: string) => Point | null
  mouth?: () => Point | null
  scale?: () => number
  skin: string
  setText: (text: string) => void
  onIncoming?: () => void
  onEaten?: () => void
  /** Enter was pressed with `text` in the bar */
  onEnter?: (text: string) => void
  /** pause after Enter before the bar clears (ms) */
  hold?: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const keysOf = (word: string) => [...[...word].map((ch) => (ch === '\b' ? 'Backspace' : ch)), 'Enter']

export function useTypingDemo(demo: Demo) {
  const latest = useRef(demo)
  useEffect(() => {
    latest.current = demo
  })

  useEffect(() => {
    if (!demo.active) return
    let timer = 0
    let word = 0
    let i = 0
    let text = ''
    let keys = keysOf(latest.current.script[0])
    const step = () => {
      const d = latest.current
      if (i >= keys.length) {
        // after Enter: clear the bar, then the next word
        text = ''
        d.setText('')
        word = (word + 1) % d.script.length
        keys = keysOf(d.script[word])
        i = 0
        timer = window.setTimeout(step, 900)
        return
      }
      const key = keys[i++]
      if (key === 'Backspace') text = text.slice(0, -1)
      else if (key !== 'Enter') text += key
      d.setText(text)
      if (key === 'Enter') d.onEnter?.(text)
      const at = d.caret(text)
      const layer = d.layer.current
      const label = keyLabel(key)
      if (at && layer && label) {
        const mouth = d.mouth?.() ?? null
        if (mouth) d.onIncoming?.()
        launchKey(layer, label, at.x, at.y, { skin: d.skin, scale: d.scale?.() ?? 1, mouth, onEaten: d.onEaten })
      }
      timer = window.setTimeout(step, key === 'Enter' ? (d.hold ?? 1600) : key === ' ' ? 220 : rand(110, 200))
    }
    timer = window.setTimeout(step, 700)
    return () => {
      clearTimeout(timer)
      latest.current.setText('')
    }
  }, [demo.active])
}

/**
 * Makes a drawn Face (FaceSvg) react to keys flying at it: mouth open and eyes on the key while
 * it's coming, a bite when it lands, a grin once they're all eaten.
 */
export function faceFeeder(svg: SVGSVGElement | null) {
  let pending = 0
  let timer = 0
  const mouth = (d: string) => svg?.querySelector('.f-mouth')?.setAttribute('d', d)
  const look = (y: number) => svg?.querySelectorAll('.f-iris').forEach((g) => g.setAttribute('transform', `translate(0 ${y})`))
  return {
    /** the middle of the mouth, in `layer`'s coordinates */
    point(layer: HTMLElement): Point | null {
      if (!svg) return null
      const s = svg.getBoundingClientRect()
      const l = layer.getBoundingClientRect()
      return { x: s.left - l.left + s.width * 0.5, y: s.top - l.top + s.height * (505 / 640) }
    },
    incoming() {
      pending++
      clearTimeout(timer)
      mouth(MOUTHS.chomp)
      look(34)
    },
    eaten() {
      pending = Math.max(0, pending - 1)
      clearTimeout(timer)
      mouth(MOUTHS.sleepy) // the bite
      timer = window.setTimeout(() => {
        if (pending) return mouth(MOUTHS.chomp)
        mouth(MOUTHS.grin)
        look(0)
        timer = window.setTimeout(() => mouth(MOUTHS.smile), 700)
      }, 130)
    },
  }
}
