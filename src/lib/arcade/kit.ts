// Shared bits for the arcade games. Each game plays itself in the search bar (a bot drives),
// and can be played for real in the Games screen: then `Screen.input` carries the keys.
// Coordinates are logical pixels.

export type Key = 'up' | 'down' | 'left' | 'right' | 'action'

/** A person's keys: what's held down, and what was pressed since the last update. */
export interface Controls {
  held: Set<Key>
  pressed: Set<Key>
}

export interface Screen {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  ink: string // theme text color
  accent: string
  /** Set when a person is playing — the bot steps aside, and dying ends the game. */
  input?: Controls
}

export interface Game<S> {
  name: string
  init: (c: Screen) => S
  update: (s: S, dt: number, c: Screen) => void
  draw: (s: S, c: Screen) => void
  /** Current score when a person is playing. */
  score: (s: S) => number
  /** True once a person's game is over. */
  over: (s: S) => boolean
}

/** Pressed this frame (edge), e.g. to jump once per key press. */
export const tapped = (c: Screen, ...keys: Key[]) => keys.some((k) => c.input?.pressed.has(k))
/** Held down right now. */
export const held = (c: Screen, ...keys: Key[]) => keys.some((k) => c.input?.held.has(k))

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function rect(c: Screen, x: number, y: number, w: number, h: number, color: string) {
  c.ctx.fillStyle = color
  c.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

/** Text-grid sprite: one char per pixel block, '.' = transparent. */
export function sprite(c: Screen, rows: string[], colors: Record<string, string>, x: number, y: number, scale = 2, flip = false) {
  const w = rows[0].length
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return
      c.ctx.fillStyle = colors[ch] ?? c.ink
      c.ctx.fillRect(Math.round(x + (flip ? w - 1 - i : i) * scale), Math.round(y + j * scale), scale, scale)
    }),
  )
}

export function withAlpha(c: Screen, a: number, draw: () => void) {
  const prev = c.ctx.globalAlpha
  c.ctx.globalAlpha = prev * clamp(a, 0, 1)
  draw()
  c.ctx.globalAlpha = prev
}

/** Little reward flashes (a rising pixel sparkle — no text). */
export interface Pop {
  x: number
  y: number
  t: number
}
export function updatePops(pops: Pop[], dt: number) {
  for (const p of pops) p.t += dt
  return pops.filter((p) => p.t < 0.7)
}
export function drawPops(c: Screen, pops: Pop[]) {
  for (const p of pops) {
    const k = p.t / 0.7
    const x = p.x
    const y = p.y - k * 12
    const r = k < 0.3 ? 2 : 3 // grows into a 4-point twinkle
    withAlpha(c, 1 - k, () => {
      rect(c, x - 1, y - r, 2, r * 2, c.accent)
      rect(c, x - r, y - 1, r * 2, 2, c.accent)
    })
  }
}

/** Burst of particles (crashes, sparkles). */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
export function burst(x: number, y: number, colors: string[], n = 14, speed = 70): Particle[] {
  return Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2
    const v = rand(speed * 0.3, speed)
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.4, 0.8), color: pick(colors) }
  })
}
export function updateParticles(ps: Particle[], dt: number, gravity = 0) {
  for (const p of ps) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += gravity * dt
    p.life -= dt
  }
  return ps.filter((p) => p.life > 0)
}
export function drawParticles(c: Screen, ps: Particle[]) {
  for (const p of ps) withAlpha(c, p.life / 0.8, () => rect(c, p.x, p.y, 2, 2, p.color))
}
