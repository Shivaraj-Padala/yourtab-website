// The arcade tile: the extension's own games (copied as-is into lib/arcade), playing themselves
// on a canvas, the way they play inside the empty search bar. Pick one with the chips.
import { useEffect, useRef, useState } from 'react'
import { bricks } from '../lib/arcade/bricks'
import { highway } from '../lib/arcade/highway'
import { jumper } from '../lib/arcade/jumper'
import type { Game, Screen } from '../lib/arcade/kit'
import { rocket } from '../lib/arcade/rocket'
import { snake } from '../lib/arcade/snake'
import { twenty48 } from '../lib/arcade/twenty48'
import { useReducedMotion } from '../lib/hooks'
import { useInView } from '../lib/useInView'

interface Entry {
  id: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  game: Game<any>
  /** logical playfield size (the wide strip of the search bar, or a field of its own) */
  w: number
  h: number
}

// the Games screen's list (GamesHub.tsx), with its playfield shapes
const GAMES: Entry[] = [
  { id: 'jumper', title: 'Jumper', game: jumper, w: 420, h: 110 },
  { id: 'highway', title: 'Highway', game: highway, w: 420, h: 110 },
  { id: 'breakout', title: 'Breakout', game: bricks, w: 240, h: 180 },
  { id: 'snake', title: 'Snake', game: snake, w: 420, h: 110 },
  { id: 'rocket', title: 'Rocket', game: rocket, w: 420, h: 110 },
  { id: '2048', title: '2048', game: twenty48, w: 420, h: 110 },
]
const ROTATE_S = 12

export function ArcadeArt() {
  const [view, inView] = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(false) // once someone picks a game, stop rotating
  const entry = GAMES[index]

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')!
    const css = getComputedStyle(el)
    const c: Screen = { ctx, w: entry.w, h: entry.h, ink: css.getPropertyValue('--text').trim() || '#16161a', accent: '#fb542b' }
    const dpr = window.devicePixelRatio || 1
    el.width = Math.round(entry.w * dpr)
    el.height = Math.round(entry.h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false

    const state = entry.game.init(c)
    const frame = () => {
      ctx.clearRect(0, 0, c.w, c.h)
      entry.game.draw(state, c)
    }
    if (reduced || !inView) {
      // a still: a couple of seconds into the game
      for (let i = 0; i < 120; i++) entry.game.update(state, 1 / 60, c)
      frame()
      return
    }
    let raf = 0
    let last = performance.now()
    let elapsed = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      elapsed += dt
      entry.game.update(state, dt, c)
      frame()
      if (!chosen && elapsed >= ROTATE_S) {
        setIndex((i) => (i + 1) % GAMES.length)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [entry, inView, reduced, chosen])

  return (
    <div className="art-arcade" ref={view}>
      <div className={`art-screen${entry.h > 120 ? ' is-tall' : ''}`} style={{ aspectRatio: `${entry.w} / ${entry.h}` }}>
        <canvas ref={canvas} role="img" aria-label={`${entry.title}, playing itself`} />
      </div>
      <div className="art-games" role="group" aria-label="Preview a game">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => {
              setChosen(true)
              setIndex(i)
            }}
          >
            {g.title}
          </button>
        ))}
      </div>
    </div>
  )
}
