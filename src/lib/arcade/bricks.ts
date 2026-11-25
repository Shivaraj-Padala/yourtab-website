// Breakout. Where there's room (the Games screen) it stands upright: the paddle along the bottom,
// a rainbow wall across the top. In a short strip (the search bar, a game card) it lies sideways:
// the paddle guards the left edge and the wall fills the right.
// Either way the game runs in one frame — the ball travels along x, away from the paddle at
// PADDLE_X, and the paddle slides along y — and upright, it's drawn turned a quarter.
// The bot predicts where each ball will arrive (bounces included) and angles its shots
// toward whatever bricks are left. Some bricks drop a multi-ball or fireball power-up.
// When you play: ← → (upright) or ↑ ↓ (sideways) move the paddle, 3 lives, 10 points a brick.
import { burst, clamp, drawParticles, drawPops, held, pick, rand, rect, updateParticles, updatePops, withAlpha, type Game, type Particle, type Pop, type Screen } from './kit.ts'

const PADDLE_X = 8
const PADDLE_W = 3
const BALL_R = 2
const GAP = 1
const MAX_BALLS = 5
/** Upright needs at least this much height (logical px); shorter screens play sideways. */
const UPRIGHT_MIN_H = 120

/** Sizes and speeds, in the game's frame. Upright the ball has further to travel to the wall and
 *  the paddle more ground to cover, so the paddle is longer and the ball a little slower. */
interface Geo {
  upright: boolean
  paddleH: number // paddle length (across the field)
  brickW: number // brick depth (along the ball's travel)
  brickH: number // brick length (across)
  ballSpeed: number
  paddleSpeed: number // yours; the bot's is a little slower
}
const SIDEWAYS: Geo = { upright: false, paddleH: 15, brickW: 10, brickH: 6, ballSpeed: 260, paddleSpeed: 300 }
const UPRIGHT: Geo = { upright: true, paddleH: 28, brickW: 6, brickH: 14, ballSpeed: 115, paddleSpeed: 320 }

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  fire: number // seconds of fireball left: plows through bricks
}
interface Brick {
  x: number
  y: number
  color: string
  alive: boolean
}
interface Power {
  x: number
  y: number
  kind: 'multi' | 'fire'
}
interface S {
  g: Geo
  paddleY: number
  aim: number // offset from paddle center the bot is trying to hit with
  balls: Ball[]
  bricks: Brick[]
  powers: Power[]
  sparks: Particle[]
  pops: Pop[]
  rebuildIn: number
  serveIn: number
  t: number
  lives: number
  points: number
  over: boolean
}

const PATTERNS: ((col: number, row: number, cols: number, rows: number) => boolean)[] = [
  () => true,
  (c, r) => (c + r) % 2 === 0,
  (c, r, cols, rows) => Math.abs(c - (cols - 1) / 2) / cols + Math.abs(r - (rows - 1) / 2) / rows < 0.5,
  (c) => c % 3 !== 1,
  (_, r, __, rows) => r !== Math.floor(rows / 2),
]

/** The field in the game's frame: `w` along the ball's travel (paddle → wall), `h` across it. */
const field = (s: S, c: Screen) => (s.g.upright ? { w: c.h, h: c.w } : { w: c.w, h: c.h })

function buildWall(s: S, c: Screen) {
  const { brickW, brickH } = s.g
  const f = field(s, c)
  // a compact wall with open space behind it, so a ball that breaks through rattles around back there
  const cols = clamp(Math.floor((f.w * 0.18) / (brickW + GAP)), 5, 8)
  const left = Math.round(f.w - 36 - cols * (brickW + GAP))
  const rows = Math.max(3, Math.floor((f.h - 4) / (brickH + GAP)))
  const top = Math.round((f.h - rows * (brickH + GAP) + GAP) / 2)
  const shape = pick(PATTERNS)
  s.bricks = []
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      if (!shape(col, row, cols, rows)) continue
      const hue = Math.round((col / cols) * 300 + rand(-8, 8))
      s.bricks.push({ x: left + col * (brickW + GAP), y: top + row * (brickH + GAP), color: `hsl(${hue} 80% 60%)`, alive: true })
    }
}

function serve(s: S) {
  const a = rand(-0.6, 0.6)
  const v = s.g.ballSpeed
  s.balls.push({ x: PADDLE_X + PADDLE_W + BALL_R + 1, y: s.paddleY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, fire: 0 })
}

/** Where will this ball cross the paddle's line? Unfolds bounces off the side walls. */
function predictY(b: Ball, f: { w: number; h: number }) {
  if (b.vx >= 0) {
    // heading away: it'll come back after the bricks/far wall — assume a mirror trip
    const dist = f.w - b.x + (f.w - PADDLE_X)
    return fold(b.y + (b.vy / Math.abs(b.vx)) * dist, f.h)
  }
  const t = (b.x - (PADDLE_X + PADDLE_W + BALL_R)) / -b.vx
  return fold(b.y + b.vy * t, f.h)
}
function fold(y: number, h: number) {
  const lo = BALL_R
  const span = h - 2 * BALL_R
  let p = (y - lo) % (2 * span)
  if (p < 0) p += 2 * span
  return lo + (p > span ? 2 * span - p : p)
}

export const bricks: Game<S> = {
  name: 'breakout',
  init(c) {
    const g = c.h >= UPRIGHT_MIN_H && c.h >= c.w * 0.5 ? UPRIGHT : SIDEWAYS
    const s: S = { g, paddleY: 0, aim: 0, balls: [], bricks: [], powers: [], sparks: [], pops: [], rebuildIn: 0, serveIn: 0.4, t: 0, lives: 3, points: 0, over: false }
    s.paddleY = field(s, c).h / 2
    buildWall(s, c)
    return s
  },
  score: (s) => s.points,
  over: (s) => s.over,
  update(s, dt, c) {
    const g = s.g
    const f = field(s, c)
    s.t += dt
    s.sparks = updateParticles(s.sparks, dt, 0)
    s.pops = updatePops(s.pops, dt)
    if (s.over) return

    if (s.balls.length === 0) {
      s.serveIn -= dt
      if (s.serveIn <= 0) serve(s)
    }
    if (s.rebuildIn > 0) {
      s.rebuildIn -= dt
      if (s.rebuildIn <= 0) buildWall(s, c)
    }

    // ── bot: follow the ball that will reach the paddle first ──
    const incoming = s.balls
      .filter((b) => b.vx < 0)
      .sort((a, b) => (a.x - PADDLE_X) / -a.vx - (b.x - PADDLE_X) / -b.vx)[0] ?? s.balls[0]
    const live = s.bricks.filter((br) => br.alive)
    if (c.input) {
      // you move the paddle (upright, the frame's y runs left → right on screen)
      const dir = g.upright ? (held(c, 'right') ? 1 : 0) - (held(c, 'left') ? 1 : 0) : (held(c, 'down') ? 1 : 0) - (held(c, 'up') ? 1 : 0)
      s.paddleY = clamp(s.paddleY + dir * g.paddleSpeed * dt, g.paddleH / 2, f.h - g.paddleH / 2)
    } else if (incoming) {
      const hitY = predictY(incoming, f)
      // drill a tunnel: aim for the row that's closest to breaking through
      s.aim = 0
      if (live.length) {
        const rows = new Map<number, Brick[]>()
        for (const br of live) rows.set(br.y, [...(rows.get(br.y) ?? []), br])
        const [rowY, row] = [...rows].sort((a, b) => a[1].length - b[1].length)[0]
        const tx = Math.min(...row.map((br) => br.x))
        const angle = clamp(Math.atan2(rowY + g.brickH / 2 - hitY, tx - PADDLE_X), -0.95, 0.95)
        s.aim = (angle / 1.0) * (g.paddleH / 2) // where on the paddle the ball must land
      }
      const target = clamp(hitY - s.aim, g.paddleH / 2, f.h - g.paddleH / 2)
      const maxMove = (g.paddleSpeed - 40) * dt
      s.paddleY += clamp(target - s.paddleY, -maxMove, maxMove)
    }

    // ── balls ──
    for (const b of s.balls) {
      b.fire = Math.max(0, b.fire - dt)
      // sub-steps so fast balls can't tunnel through bricks
      const steps = 3
      for (let k = 0; k < steps; k++) {
        b.x += (b.vx * dt) / steps
        b.y += (b.vy * dt) / steps
        if (b.y < BALL_R) {
          b.y = BALL_R
          b.vy = Math.abs(b.vy)
        }
        if (b.y > f.h - BALL_R) {
          b.y = f.h - BALL_R
          b.vy = -Math.abs(b.vy)
        }
        if (b.x > f.w - BALL_R) {
          b.x = f.w - BALL_R
          b.vx = -Math.abs(b.vx)
        }
        // paddle
        if (b.vx < 0 && b.x - BALL_R <= PADDLE_X + PADDLE_W && b.x > PADDLE_X - 2 && Math.abs(b.y - s.paddleY) <= g.paddleH / 2 + BALL_R) {
          const off = clamp((b.y - s.paddleY) / (g.paddleH / 2), -1, 1)
          const angle = off * 1.0 // up to ~57° away from straight
          b.vx = Math.cos(angle) * g.ballSpeed
          b.vy = Math.sin(angle) * g.ballSpeed
          b.x = PADDLE_X + PADDLE_W + BALL_R
        }
        // bricks
        for (const br of live) {
          if (!br.alive) continue
          const nx = clamp(b.x, br.x, br.x + g.brickW)
          const ny = clamp(b.y, br.y, br.y + g.brickH)
          if ((b.x - nx) ** 2 + (b.y - ny) ** 2 > BALL_R * BALL_R) continue
          br.alive = false
          s.points += 10
          s.sparks.push(...burst(br.x + g.brickW / 2, br.y + g.brickH / 2, b.fire > 0 ? ['#ff9f0a', '#ffd60a', br.color] : [br.color, '#ffffff'], 7, 55))
          const roll = Math.random()
          if (roll < 0.1 && s.balls.length < MAX_BALLS) s.powers.push({ x: br.x, y: br.y + g.brickH / 2, kind: 'multi' })
          else if (roll < 0.16) s.powers.push({ x: br.x, y: br.y + g.brickH / 2, kind: 'fire' })
          if (b.fire > 0) continue // fireballs plow straight through
          // bounce off the side we hit
          const overlapX = Math.min(Math.abs(b.x - br.x), Math.abs(b.x - (br.x + g.brickW)))
          const overlapY = Math.min(Math.abs(b.y - br.y), Math.abs(b.y - (br.y + g.brickH)))
          if (overlapX < overlapY) b.vx = -b.vx
          else b.vy = -b.vy
          break
        }
      }
    }
    // lost balls
    const before = s.balls.length
    s.balls = s.balls.filter((b) => b.x > -6)
    if (before && !s.balls.length) {
      s.serveIn = 0.7
      if (c.input && --s.lives <= 0) s.over = true
    }

    // power-ups drift toward the paddle: catch → multi-ball
    for (const p of s.powers) p.x -= 45 * dt
    s.powers = s.powers.filter((p) => {
      if (p.x <= PADDLE_X + PADDLE_W && p.x > PADDLE_X - 4 && Math.abs(p.y - s.paddleY) < g.paddleH / 2 + 3) {
        if (p.kind === 'fire') {
          for (const b of s.balls) b.fire = 3.5
          s.pops.push({ x: 26, y: s.paddleY - (g.upright ? 0 : 10), t: 0 })
          return false
        }
        const src = s.balls[0]
        for (const a of [-0.5, 0.5]) {
          if (s.balls.length >= MAX_BALLS) break
          s.balls.push(
            src
              ? { x: src.x, y: src.y, vx: Math.cos(a) * g.ballSpeed * Math.sign(src.vx || 1), vy: Math.sin(a) * g.ballSpeed, fire: src.fire }
              : { x: PADDLE_X + 8, y: s.paddleY, vx: Math.cos(a) * g.ballSpeed, vy: Math.sin(a) * g.ballSpeed, fire: 0 },
          )
        }
        s.pops.push({ x: 26, y: s.paddleY - (g.upright ? 0 : 10), t: 0 })
        return false
      }
      return p.x > -6
    })

    if (s.rebuildIn <= 0 && !s.bricks.some((br) => br.alive)) {
      s.pops.push({ x: f.w * 0.75, y: f.h / 2, t: 0 })
      s.rebuildIn = 0.9
    }
  },
  draw(s, c) {
    const { ctx } = c
    const g = s.g
    ctx.save()
    // upright: turn the frame a quarter, so its x (away from the paddle) points up the screen
    // and its y runs left → right — frame (x, y) lands on screen (y, h − x)
    if (g.upright) ctx.transform(0, -1, 1, 0, 0, c.h)
    for (const br of s.bricks) {
      if (!br.alive) continue
      rect(c, br.x, br.y, g.brickW, g.brickH, br.color)
      // highlight along the edge that faces up on screen
      withAlpha(c, 0.35, () => (g.upright ? rect(c, br.x + g.brickW - 1, br.y, 1, g.brickH, '#ffffff') : rect(c, br.x, br.y, g.brickW, 1, '#ffffff')))
    }
    for (const p of s.powers) {
      const pulse = 0.6 + 0.4 * Math.sin(s.t * 12)
      const color = p.kind === 'fire' ? '#ff9f0a' : c.accent
      withAlpha(c, pulse, () => {
        rect(c, p.x - 3, p.y - 1, 6, 2, color)
        rect(c, p.x - 1, p.y - 3, 2, 6, color)
      })
    }
    // paddle with a soft glow
    withAlpha(c, 0.25, () => rect(c, PADDLE_X - 1, s.paddleY - g.paddleH / 2 - 1, PADDLE_W + 2, g.paddleH + 2, c.accent))
    rect(c, PADDLE_X, s.paddleY - g.paddleH / 2, PADDLE_W, g.paddleH, c.accent)
    // balls with short motion trails
    for (const b of s.balls) {
      const hot = b.fire > 0
      const trail = hot ? 6 : 3
      for (let i = 1; i <= trail; i++)
        withAlpha(c, (hot ? 0.5 : 0.25) / i, () =>
          rect(c, b.x - BALL_R - (b.vx / g.ballSpeed) * i * 3, b.y - BALL_R - (b.vy / g.ballSpeed) * i * 3, BALL_R * 2, BALL_R * 2, hot ? (i < 3 ? '#ffd60a' : '#ff9f0a') : c.ink),
        )
      ctx.fillStyle = hot ? '#ff9f0a' : c.ink
      ctx.beginPath()
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2)
      ctx.fill()
    }
    drawParticles(c, s.sparks)
    ctx.restore()
    // reward twinkles rise up the screen either way, so they're placed in screen coordinates
    drawPops(c, g.upright ? s.pops.map((p) => ({ ...p, x: p.y, y: c.h - p.x })) : s.pops)
  },
}
