// 2048 — slide the tiles, merge equal numbers, aim for 2048 (and keep going).
// You play with the arrow keys; in previews a bot plays (keeps the big tiles in a corner).
import { burst, drawParticles, tapped, updateParticles, type Game, type Particle, type Screen } from './kit.ts'

const N = 4
const SLIDE = 0.1 // s
const POP = 0.16 // s
const BOT_STEP = 0.2 // s between bot moves

type Dir = 'up' | 'down' | 'left' | 'right'

interface Tile {
  id: number
  v: number
  r: number
  c: number
  fr: number // where it slid from (for the animation)
  fc: number
  born: number // time it appeared (pop-in)
  merged: number // time it was merged into (pulse)
  dying: boolean // slid into another tile; removed after the slide
}

interface S {
  tiles: Tile[]
  t: number
  slideAt: number // when the last slide started
  points: number
  over: boolean
  won: boolean
  nextId: number
  botIn: number
  resetIn: number
  sparks: Particle[]
}

// ── board logic ──

function grid(s: S): (Tile | null)[][] {
  const g: (Tile | null)[][] = Array.from({ length: N }, () => Array<Tile | null>(N).fill(null))
  for (const t of s.tiles) if (!t.dying) g[t.r][t.c] = t
  return g
}

function spawn(s: S) {
  const g = grid(s)
  const free: [number, number][] = []
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) free.push([r, c])
  if (!free.length) return
  const [r, c] = free[Math.floor(Math.random() * free.length)]
  s.tiles.push({ id: s.nextId++, v: Math.random() < 0.9 ? 2 : 4, r, c, fr: r, fc: c, born: s.t + SLIDE, merged: -1, dying: false })
}

function reset(s: S) {
  s.tiles = []
  s.points = 0
  s.over = false
  s.won = false
  spawn(s)
  spawn(s)
}

/** The cells of each line, ordered from the edge the tiles slide towards. */
function lines(dir: Dir): [number, number][][] {
  const out: [number, number][][] = []
  for (let i = 0; i < N; i++) {
    const line: [number, number][] = []
    for (let j = 0; j < N; j++) {
      if (dir === 'left') line.push([i, j])
      if (dir === 'right') line.push([i, N - 1 - j])
      if (dir === 'up') line.push([j, i])
      if (dir === 'down') line.push([N - 1 - j, i])
    }
    out.push(line)
  }
  return out
}

/** Slides everything one way. Returns the points earned, or -1 if nothing could move. */
function move(s: S, dir: Dir, c?: Screen, cell = 0, ox = 0, oy = 0): number {
  s.tiles = s.tiles.filter((t) => !t.dying)
  const g = grid(s)
  for (const t of s.tiles) {
    t.fr = t.r
    t.fc = t.c
  }
  let moved = false
  let points = 0
  for (const line of lines(dir)) {
    let target = 0
    let last: Tile | null = null // the tile at the previous target, can still merge once
    for (const [r, c2] of line) {
      const t = g[r][c2]
      if (!t) continue
      if (last && last.v === t.v && last.merged !== s.t) {
        // merge into `last`
        const [lr, lc] = [last.r, last.c]
        t.r = lr
        t.c = lc
        t.dying = true
        last.v *= 2
        last.merged = s.t
        points += last.v
        moved = true
        if (last.v === 2048) s.won = true
        // sparks on every merge — a big burst for 2048
        if (c && cell) s.sparks.push(...burst(ox + (lc + 0.5) * cell, oy + (lr + 0.5) * cell, [tileColor(last.v), '#ffffff'], last.v === 2048 ? 40 : last.v >= 128 ? 12 : 6, last.v === 2048 ? 90 : 40))
        last = null
        continue
      }
      const [tr, tc] = line[target]
      if (tr !== t.r || tc !== t.c) moved = true
      t.r = tr
      t.c = tc
      last = t
      target++
    }
  }
  if (!moved) return -1
  s.points += points
  s.slideAt = s.t
  spawn(s)
  return points
}

function canMove(s: S) {
  const g = grid(s)
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const t = g[r][c]
      if (!t) return true
      if (c + 1 < N && g[r][c + 1]?.v === t.v) return true
      if (r + 1 < N && g[r + 1][c]?.v === t.v) return true
    }
  return false
}

// ── bot: try each move on a copy, prefer keeping big tiles in the bottom-left corner ──

function clone(s: S): S {
  return { ...s, tiles: s.tiles.filter((t) => !t.dying).map((t) => ({ ...t })), sparks: [] }
}
function evaluate(s: S) {
  const g = grid(s)
  let empty = 0
  let corner = 0
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const v = g[r][c]?.v ?? 0
      if (!v) empty++
      corner += v * (r + 1) * (N - c) // weight towards bottom-left
    }
  return empty * 400 + corner
}
function botMove(s: S): Dir | null {
  let best: Dir | null = null
  let bestScore = -Infinity
  for (const d of ['down', 'left', 'right', 'up'] as Dir[]) {
    const copy = clone(s)
    const gained = move(copy, d)
    if (gained < 0) continue
    const score = gained * 4 + evaluate(copy) - (d === 'up' ? 5000 : 0)
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

// ── drawing ──

/** Warm to hot as the numbers grow. */
function tileColor(v: number) {
  const i = Math.log2(v) - 1 // 2 → 0 … 2048 → 10
  const hue = (48 - i * 22 + 360) % 360
  return `hsl(${hue} ${70 + Math.min(i, 6) * 3}% ${Math.max(48, 74 - i * 3)}%)`
}

function layout(c: Screen) {
  const board = Math.floor(Math.min(c.h - 6, c.w - 6))
  const ox = Math.floor((c.w - board) / 2)
  const oy = Math.floor((c.h - board) / 2)
  return { board, ox, oy, cell: board / N }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

export const twenty48: Game<S> = {
  name: '2048',
  init() {
    const s: S = { tiles: [], t: 0, slideAt: -1, points: 0, over: false, won: false, nextId: 1, botIn: 0.6, resetIn: 0, sparks: [] }
    reset(s)
    return s
  },
  score: (s) => s.points,
  over: (s) => s.over,
  update(s, dt, c) {
    s.t += dt
    s.sparks = updateParticles(s.sparks, dt, 0)
    const { ox, oy, cell } = layout(c)

    if (c.input) {
      if (s.over) return
      const dir = (['up', 'down', 'left', 'right'] as Dir[]).find((d) => tapped(c, d))
      if (dir && move(s, dir, c, cell, ox, oy) >= 0 && !canMove(s)) s.over = true
      return
    }

    // the bot (previews): steady moves, starts over when stuck
    if (s.resetIn > 0) {
      s.resetIn -= dt
      if (s.resetIn <= 0) reset(s)
      return
    }
    s.botIn -= dt
    if (s.botIn <= 0) {
      s.botIn = BOT_STEP
      const d = botMove(s)
      if (d) move(s, d, c, cell, ox, oy)
      if (!d || !canMove(s)) s.resetIn = 1.2
    }
  },
  draw(s, c) {
    const { ctx } = c
    const { board, ox, oy, cell } = layout(c)
    const gap = Math.max(1, cell * 0.1)
    const radius = Math.max(1, cell * 0.14)

    // board + empty cells
    ctx.save()
    ctx.globalAlpha *= 0.1
    roundRect(ctx, ox - gap / 2, oy - gap / 2, board + gap, board + gap, radius * 1.4, c.ink)
    ctx.restore()
    ctx.save()
    ctx.globalAlpha *= 0.08
    for (let r = 0; r < N; r++) for (let col = 0; col < N; col++) roundRect(ctx, ox + col * cell + gap / 2, oy + r * cell + gap / 2, cell - gap, cell - gap, radius, c.ink)
    ctx.restore()

    // tiles: slide from where they were, pop in when new, pulse when merged
    const slide = Math.min(1, (s.t - s.slideAt) / SLIDE)
    const ease = 1 - (1 - slide) ** 3
    const ordered = [...s.tiles].sort((a, b) => Number(b.dying) - Number(a.dying)) // merged-away tiles underneath
    for (const t of ordered) {
      if (t.dying && slide >= 1) continue
      if (s.t < t.born) continue // appears after the slide
      const r = t.fr + (t.r - t.fr) * ease
      const col = t.fc + (t.c - t.fc) * ease
      const popK = Math.min(1, (s.t - t.born) / POP)
      const pulseK = t.merged >= 0 ? Math.min(1, (s.t - t.merged - SLIDE) / POP) : 1
      const scale = popK < 1 ? 0.3 + 0.7 * popK : pulseK >= 0 && pulseK < 1 ? 1 + 0.14 * Math.sin(pulseK * Math.PI) : 1
      const size = (cell - gap) * scale
      const x = ox + col * cell + cell / 2 - size / 2
      const y = oy + r * cell + cell / 2 - size / 2
      roundRect(ctx, x, y, size, size, radius * scale, tileColor(t.v))
      // number
      const digits = String(t.v).length
      ctx.fillStyle = t.v <= 4 ? '#5a4632' : '#ffffff'
      ctx.font = `800 ${Math.round(size * (digits <= 2 ? 0.46 : digits === 3 ? 0.38 : 0.3))}px ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(t.v), x + size / 2, y + size / 2 + size * 0.03)
    }
    drawParticles(c, s.sparks)
  },
}
