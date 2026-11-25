// "Meet the Face": a simplified version of YourTab's Face. The eyes follow the pointer, it blinks,
// winks when clicked, dozes off when left alone, and eats what's typed into the search bar below
// it: the keys fly into its mouth (flyingKeys.ts). While nobody types, the bar types by itself.
// With reduced motion it stays still and only reacts to clicks.
import { useCallback, useEffect, useRef, useState } from 'react'
import { keyLabel, launchKey, textWidth, type Point } from '../lib/flyingKeys'
import { useReducedMotion } from '../lib/hooks'
import { useTypingDemo } from '../lib/typingDemo'
import { useInView } from '../lib/useInView'
import { BROWS, EYES, LID_OPEN, LID_SHUT, MOUTHS } from '../lib/face'
import { FaceSvg } from './FaceSvg'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function FaceSection() {
  const reduced = useReducedMotion()
  const [panelRef, inView] = useInView<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const barText = useRef<HTMLSpanElement>(null)
  const winkRef = useRef<() => void>(() => {})
  // how the Face reacts to keys flying at it (set up by the effect below)
  const feed = useRef<{ mouth: () => Point | null; incoming: () => void; eaten: () => void } | null>(null)

  // the search bar under the face: what you type, or the demo while nobody's typing
  const [text, setText] = useState('')
  const textRef = useRef('')
  const typing = useRef(false)
  const [userTyping, setUserTyping] = useState(false)
  const caretAt = useCallback(
    (t: string): Point | null => {
      const p = panelRef.current?.getBoundingClientRect()
      const b = barRef.current?.getBoundingClientRect()
      const tx = barText.current
      if (!p || !b || !tx) return null
      return { x: Math.min(b.right - p.left - 20, tx.getBoundingClientRect().left - p.left + textWidth(tx, t)), y: b.top - p.top + 4 }
    },
    [panelRef],
  )
  useTypingDemo({
    active: inView && !reduced && !userTyping,
    script: ['hello', 'cookies', 'pizza', 'more'],
    layer: panelRef,
    skin: '#fb542b',
    hold: 1200,
    setText: (t) => {
      if (typing.current) return
      textRef.current = t
      setText(t)
    },
    caret: caretAt,
    mouth: () => feed.current?.mouth() ?? null,
    onIncoming: () => feed.current?.incoming(),
    onEaten: () => feed.current?.eaten(),
  })

  useEffect(() => {
    const svg = svgRef.current
    const panel = panelRef.current
    if (!svg || !panel) return
    const q = <T extends Element>(s: string) => [...svg.querySelectorAll<T>(s)]
    const head = svg.querySelector<SVGGElement>('.f-head')!
    const irises = q<SVGGElement>('.f-iris')
    const lids = q<SVGGElement>('.f-lid')
    const brows = q<SVGGElement>('.f-brow')
    const mouth = svg.querySelector<SVGPathElement>('.f-mouth')!

    // state
    const look = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    let blinkStart = -1
    let nextBlink = performance.now() + 2500
    let winkUntil = 0
    let chompUntil = 0
    let lastActive = performance.now()
    let sleepy = false
    let raf = 0
    let visible = false

    const draw = (now: number) => {
      // gaze
      look.x += (target.x - look.x) * 0.14
      look.y += (target.y - look.y) * 0.14
      const asleep = sleepy
      const ly = asleep ? 0.35 : look.y
      head.setAttribute('transform', `translate(${(look.x * 14).toFixed(1)} ${(ly * 8).toFixed(1)})`)
      irises.forEach((g) => g.setAttribute('transform', `translate(${(look.x * 52).toFixed(1)} ${(ly * 42).toFixed(1)})`))

      // lids: blink on top of the base (open, or half shut when sleepy)
      let blink = 0
      if (blinkStart >= 0) {
        const t = (now - blinkStart) / 170
        blink = t >= 2 ? 0 : t < 1 ? t : 2 - t
        if (t >= 2) blinkStart = -1
      } else if (!reduced && now > nextBlink && !asleep) {
        blinkStart = now
        nextBlink = now + 2200 + Math.random() * 3800
      }
      const winking = now < winkUntil
      const base = asleep ? 0.62 : 0
      lids.forEach((g, i) => {
        const shut = i === 1 && winking ? 1 : Math.max(base, blink)
        const y = EYES[i].cy + LID_OPEN + shut * (LID_SHUT - LID_OPEN)
        g.setAttribute('transform', `translate(${EYES[i].cx} ${y.toFixed(1)})`)
      })
      brows.forEach((g, i) => {
        const b = BROWS[i]
        const lift = winking && i === 0 ? -22 : asleep ? 10 : 0
        g.setAttribute(
          'transform',
          `translate(${(b.x + look.x * 6).toFixed(1)} ${(b.y + lift + ly * 4).toFixed(1)}) scale(${i === 1 ? -1 : 1} 1)`,
        )
      })
      mouth.setAttribute('d', now < chompUntil ? MOUTHS.chomp : winking ? MOUTHS.grin : asleep ? MOUTHS.sleepy : MOUTHS.smile)
      panel.classList.toggle('is-sleepy', asleep)
    }

    // The loop only runs while something is moving. Once the eyes settle it stops, and a timer
    // wakes it for the next blink or for dozing off, so a resting face costs nothing.
    let timer = 0
    const settled = (now: number) =>
      Math.abs(target.x - look.x) < 0.002 &&
      Math.abs(target.y - look.y) < 0.002 &&
      blinkStart < 0 &&
      now > winkUntil + 32 &&
      now > chompUntil + 32
    const loop = (now: number) => {
      if (!sleepy && now - lastActive > 8000) sleepy = true
      draw(now)
      if (visible && !settled(now)) {
        raf = requestAnimationFrame(loop)
        return
      }
      raf = 0
      clearTimeout(timer)
      if (!visible) return
      const sleepAt = sleepy ? Infinity : lastActive + 8000
      const next = Math.min(reduced || sleepy ? Infinity : nextBlink, sleepAt)
      if (next < Infinity) timer = window.setTimeout(kick, Math.max(16, next - now))
    }
    const kick = () => {
      clearTimeout(timer)
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      lastActive = performance.now()
      if (sleepy) {
        sleepy = false
        blinkStart = performance.now()
      }
      kick()
    }

    // look at a point on screen
    const lookAt = (px: number, py: number) => {
      const r = svg.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.5
      target.x = clamp((px - cx) / (r.width * 0.75), -1, 1)
      target.y = clamp((py - cy) / (r.height * 1.1), -1, 1)
    }
    const onPointer = (e: PointerEvent) => {
      lookAt(e.clientX, e.clientY)
      wake()
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
    }

    feed.current = {
      mouth: () => {
        const pr = panel.getBoundingClientRect()
        const sr = svg.getBoundingClientRect()
        return { x: sr.left - pr.left + sr.width * 0.5, y: sr.top - pr.top + sr.height * (505 / 640) }
      },
      // eyes down on the bar while a key is on its way
      incoming: () => {
        wake()
        target.x = 0
        target.y = 1
      },
      eaten: () => {
        chompUntil = performance.now() + 240
        target.x = 0
        target.y = 0
        kick()
      },
    }

    // your own typing goes into the bar and flies into the mouth
    let pause = 0
    const onKey = (e: KeyboardEvent) => {
      if (!visible || e.metaKey || e.ctrlKey || e.altKey) return
      const label = keyLabel(e.key)
      if (!label) return
      const el = e.target
      if (el instanceof Element && el.closest('input, textarea, select, button, a, [contenteditable="true"]')) return
      typing.current = true
      setUserTyping(true)
      clearTimeout(pause)
      pause = window.setTimeout(() => {
        typing.current = false
        setUserTyping(false)
      }, 5000)
      const prev = textRef.current
      const next = e.key === 'Backspace' ? prev.slice(0, -1) : e.key === 'Enter' ? prev : (prev + e.key).slice(-24)
      textRef.current = e.key === 'Enter' ? '' : next
      setText(next)
      if (e.key === 'Enter') window.setTimeout(() => setText(textRef.current), 500)
      const at = caretAt(next)
      if (!at) return
      feed.current!.incoming()
      launchKey(panel, label, at.x, at.y, { skin: '#fb542b', mouth: feed.current!.mouth(), onEaten: feed.current!.eaten })
    }

    winkRef.current = () => {
      winkUntil = performance.now() + 650
      wake()
      draw(performance.now())
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) {
        lastActive = performance.now()
        kick()
      }
    })

    draw(performance.now())
    if (!reduced) {
      io.observe(panel)
      window.addEventListener('pointermove', onPointer, { passive: true })
      window.addEventListener('pointerdown', onPointer, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      window.addEventListener('keydown', onKey)
    } else {
      // still: no tracking, no blinking, no letters; clicks still wink
      winkRef.current = () => {
        winkUntil = performance.now() + 650
        draw(performance.now())
        window.setTimeout(() => draw(performance.now()), 700)
      }
    }
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      io.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
      clearTimeout(pause)
      feed.current = null
    }
  }, [reduced, panelRef, caretAt])

  return (
    <section className="section face-section" id="face" aria-labelledby="face-title">
      <div className="wrap face-grid">
        <div className="face-copy reveal">
          <p className="eyebrow">Meet the Face</p>
          <h2 className="h2" id="face-title">
            A new tab that looks back.
          </h2>
          <p className="lead">
            Turn it on and your page comes alive. It follows your cursor, blinks, dozes off when you step away, and eats every key
            you type.
          </p>
          <p className="face-hint">Try it: move your pointer, click it, or type something to feed it. It's off until you turn it on.</p>
        </div>

        <div className="face-panel reveal-open" ref={panelRef}>
          <button type="button" className="face-btn" aria-label="Wink at the Face" onClick={() => winkRef.current()}>
            <FaceSvg svgRef={svgRef} />
          </button>
          <div className="face-bar" ref={barRef} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>
            <span className="face-bar-text">
              <span ref={barText}>{text || <span className="face-bar-ph">Search anything…</span>}</span>
              <i className="art-caret" />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
