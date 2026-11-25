// Flying keys, ported from the extension (src/features/search/lib/flying-keys.ts): every key typed in the
// search bar pops out of its top edge as a little keycap, arcs up, tumbles, and fades before it
// can fall back down. With the Face on, the keys arc into its mouth instead, and it eats them.
// Here the keys live inside a "layer" element (a tile, the mock page) instead of the whole page,
// and `scale` shrinks the whole thing for the scaled-down mock. Pure DOM + Web Animations.

export interface KeyLabel {
  text: string
  wide?: boolean
  tone?: 'red' | 'green'
}

export interface Point {
  x: number
  y: number
}

const GRAVITY = 1900 // px/s²
const MAX_KEYS = 24
const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** The label on the keycap for a key, or null for keys that don't fly (keyLabel in the extension). */
export function keyLabel(key: string): KeyLabel | null {
  if (key === ' ') return { text: 'space', wide: true }
  if (key === 'Backspace') return { text: '⌫', tone: 'red' }
  if (key === 'Enter') return { text: 'return ⏎', wide: true, tone: 'green' }
  if (key.length === 1) return { text: key.toUpperCase() }
  return null
}

interface Options {
  /** the keycap's tint: the accent color */
  skin: string
  /** 1 = the extension's size */
  scale?: number
  /** fly into the Face's mouth instead (layer coordinates) */
  mouth?: Point | null
  onEaten?: () => void
}

/** Launch a keycap from (x, y) in `layer`'s coordinates. */
export function launchKey(layer: HTMLElement, label: KeyLabel, x: number, y: number, { skin, scale = 1, mouth, onEaten }: Options) {
  if (layer.querySelectorAll('.fly-key').length >= MAX_KEYS) return
  const el = document.createElement('span')
  el.className = `fly-key${label.wide ? ' is-wide' : ''}${label.tone ? ` is-${label.tone}` : ''}`
  el.textContent = label.text
  el.setAttribute('aria-hidden', 'true')
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  el.style.setProperty('--face', skin)
  layer.appendChild(el)

  if (mouth) {
    feedFace(el, x, y, mouth, scale, onEaten)
    return
  }

  // A little parabola up and out with gravity, tumbling as it goes. It ends (fully faded) just
  // before the arc comes back down to the bar's top edge, so it never drops over the bar.
  const vx = rand(-240, 240)
  const vy = rand(-720, -540)
  const spin = rand(-420, 420)
  const duration = ((2 * -vy) / GRAVITY) * 0.9
  const steps = 16
  const frames: Keyframe[] = []
  for (let i = 0; i <= steps; i++) {
    const p = i / steps
    const t = p * duration
    const dx = vx * t * scale
    const dy = (vy * t + 0.5 * GRAVITY * t * t) * scale
    const s = (i === 0 ? 0.4 : i === 1 ? 1.15 : 1 - 0.2 * p) * scale
    frames.push({
      transform: `translate(-50%, -100%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(spin * p).toFixed(1)}deg) scale(${s.toFixed(3)})`,
      opacity: p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.45),
    })
  }
  el.animate(frames, { duration: duration * 1000, easing: 'linear' }).finished.finally(() => el.remove())
}

const FEED_STEPS = 24
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)

/** Toss the key up in an arc into the Face's mouth; the Face chomps it (feedFace in the extension). */
function feedFace(el: HTMLElement, x: number, y: number, mouth: Point, scale: number, onEaten?: () => void) {
  const dx = mouth.x - x
  const dy = mouth.y - y
  const lift = (Math.max(90, Math.abs(dy / scale) * 0.45) + rand(0, 50)) * scale
  const cx = dx * rand(0.35, 0.6) + rand(-60, 60) * scale
  const cy = Math.min(dy, 0) - lift
  const spin = rand(-260, 260)
  const duration = rand(520, 640)
  const frames: Keyframe[] = []
  for (let i = 0; i <= FEED_STEPS; i++) {
    const p = i / FEED_STEPS
    const t = easeInOut(p)
    const px = 2 * (1 - t) * t * cx + t * t * dx
    const py = 2 * (1 - t) * t * cy + t * t * dy
    const s = (i === 0 ? 0.4 : p < 0.12 ? 1.12 : p < 0.7 ? 1 : 1 - ((p - 0.7) / 0.3) * 0.75) * scale
    frames.push({
      transform: `translate(-50%, -50%) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${(spin * t).toFixed(1)}deg) scale(${s.toFixed(3)})`,
      opacity: p < 0.88 ? 1 : 1 - (p - 0.88) / 0.12,
    })
  }
  el.animate(frames, { duration, easing: 'linear' }).finished.finally(() => {
    el.remove()
    onEaten?.()
  })
}

let measure: CanvasRenderingContext2D | null = null
/** Width of `text` in the font `el` uses (for where the caret is). */
export function textWidth(el: Element, text: string) {
  measure ??= document.createElement('canvas').getContext('2d')
  if (!measure) return text.length * 9
  const cs = getComputedStyle(el)
  measure.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  return measure.measureText(text).width
}
