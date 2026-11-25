// Snake, played by a bot that pathfinds to the food (BFS) and avoids itself —
// or by you with the arrow keys (walls and your own tail end the game).
import { rect, tapped, type Game } from './kit.ts'

const CELL = 6
type P = { x: number; y: number }

interface S {
  cols: number
  rows: number
  body: P[] // head first
  food: P
  acc: number
  score: number
  best: number
  dead: number
  dir: P // your heading (when you play)
  queued: P[] // turns pressed between steps, applied one per step
  over: boolean
}

const DIRS: P[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
]

function placeFood(s: S) {
  const free: P[] = []
  for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) if (!s.body.some((b) => b.x === x && b.y === y)) free.push({ x, y })
  s.food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

function reset(s: S) {
  const y = Math.floor(s.rows / 2)
  s.body = [
    { x: 3, y },
    { x: 2, y },
    { x: 1, y },
  ]
  s.score = 0
  s.dir = { x: 1, y: 0 }
  s.queued = []
  placeFood(s)
}

/** Flood-fill size reachable from `start` — used to avoid boxing itself in. */
function space(s: S, start: P, blocked: Set<number>) {
  const key = (x: number, y: number) => y * s.cols + x
  const seen = new Set([key(start.x, start.y)])
  const q = [start]
  for (let i = 0; i < q.length && seen.size < s.body.length * 2; i++)
    for (const d of DIRS) {
      const n = { x: q[i].x + d.x, y: q[i].y + d.y }
      const k = key(n.x, n.y)
      if (n.x >= 0 && n.y >= 0 && n.x < s.cols && n.y < s.rows && !blocked.has(k) && !seen.has(k)) {
        seen.add(k)
        q.push(n)
      }
    }
  return seen.size
}

function nextStep(s: S): P | null {
  const head = s.body[0]
  const key = (x: number, y: number) => y * s.cols + x
  const blocked = new Set(s.body.slice(0, -1).map((b) => key(b.x, b.y))) // the tail moves away
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < s.cols && y < s.rows

  // BFS from the head; remember which first move led to each cell
  const first = new Map<number, number>()
  const queue: P[] = []
  DIRS.forEach((d, i) => {
    const n = { x: head.x + d.x, y: head.y + d.y }
    if (inside(n.x, n.y) && !blocked.has(key(n.x, n.y))) {
      first.set(key(n.x, n.y), i)
      queue.push(n)
    }
  })
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi]
    if (cur.x === s.food.x && cur.y === s.food.y) {
      const d = DIRS[first.get(key(cur.x, cur.y))!]
      const n = { x: head.x + d.x, y: head.y + d.y }
      if (space(s, n, blocked) > s.body.length / 2) return d
      break
    }
    for (const d of DIRS) {
      const n = { x: cur.x + d.x, y: cur.y + d.y }
      const k = key(n.x, n.y)
      if (inside(n.x, n.y) && !blocked.has(k) && !first.has(k)) {
        first.set(k, first.get(key(cur.x, cur.y))!)
        queue.push(n)
      }
    }
  }
  // no safe path to food: take the move with the most room
  let best: P | null = null
  let bestRoom = -1
  for (const d of DIRS) {
    const n = { x: head.x + d.x, y: head.y + d.y }
    if (!inside(n.x, n.y) || blocked.has(key(n.x, n.y))) continue
    const room = space(s, n, blocked)
    if (room > bestRoom) {
      bestRoom = room
      best = d
    }
  }
  return best
}

export const snake: Game<S> = {
  name: 'snake',
  init(c) {
    const s: S = {
      cols: Math.max(10, Math.floor((c.w - 4) / CELL)),
      rows: Math.max(5, Math.floor((c.h - 6) / CELL)),
      body: [],
      food: { x: 0, y: 0 },
      acc: 0,
      score: 0,
      best: 0,
      dead: 0,
      dir: { x: 1, y: 0 },
      queued: [],
      over: false,
    }
    reset(s)
    return s
  },
  score: (s) => s.score,
  over: (s) => s.over,
  update(s, dt, c) {
    if (c.input) {
      // turns you press are queued so quick double-turns aren't lost; no reversing into yourself
      const want: [Parameters<typeof tapped>[1], P][] = [
        ['up', { x: 0, y: -1 }],
        ['down', { x: 0, y: 1 }],
        ['left', { x: -1, y: 0 }],
        ['right', { x: 1, y: 0 }],
      ]
      for (const [k, d] of want) {
        const last = s.queued.at(-1) ?? s.dir
        if (tapped(c, k) && !(d.x === -last.x && d.y === -last.y) && !(d.x === last.x && d.y === last.y) && s.queued.length < 3) s.queued.push(d)
      }
      if (s.over) return
      s.acc += dt
      const stepTime = Math.max(0.1, 0.18 - s.score * 0.002) // seconds per cell: speeds up as you grow
      while (s.acc > stepTime) {
        s.acc -= stepTime
        s.dir = s.queued.shift() ?? s.dir
        const head = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y }
        const eats = head.x === s.food.x && head.y === s.food.y
        const hitsSelf = s.body.slice(0, eats ? s.body.length : -1).some((b) => b.x === head.x && b.y === head.y)
        if (head.x < 0 || head.y < 0 || head.x >= s.cols || head.y >= s.rows || hitsSelf) {
          s.over = true
          s.dead = 999
          return
        }
        s.body.unshift(head)
        if (eats) {
          s.score++
          placeFood(s)
        } else s.body.pop()
      }
      return
    }
    if (s.dead > 0) {
      s.dead -= dt
      if (s.dead <= 0) reset(s)
      return
    }
    s.acc += dt
    while (s.acc > 0.08) {
      s.acc -= 0.08
      const d = nextStep(s)
      if (!d) {
        s.dead = 0.9
        return
      }
      const head = { x: s.body[0].x + d.x, y: s.body[0].y + d.y }
      s.body.unshift(head)
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score++
        s.best = Math.max(s.best, s.score)
        placeFood(s)
      } else s.body.pop()
    }
  },
  draw(s, c) {
    const ox = Math.floor((c.w - s.cols * CELL) / 2)
    const oy = Math.floor((c.h - s.rows * CELL) / 2)
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 160)
    c.ctx.globalAlpha *= pulse
    rect(c, ox + s.food.x * CELL + 1, oy + s.food.y * CELL + 1, CELL - 2, CELL - 2, c.accent)
    c.ctx.globalAlpha /= pulse
    const flash = s.dead > 0 && Math.floor(s.dead * 8) % 2 === 0
    const base = c.ctx.globalAlpha
    s.body.forEach((b, i) => {
      c.ctx.globalAlpha = base * (flash ? 0.15 : 0.95 - (i / s.body.length) * 0.55)
      rect(c, ox + b.x * CELL + 0.5, oy + b.y * CELL + 0.5, CELL - 1, CELL - 1, i === 0 ? c.accent : c.ink)
    })
    c.ctx.globalAlpha = base
  },
}
