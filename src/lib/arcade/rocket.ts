// Rocket — dodges an asteroid field and grabs stars. Steering is a little potential field:
// asteroids ahead push the rocket away, the nearest star pulls it in.
// When you fly: hold ↑ / ↓ to move (let go and it stops), stars score, and an asteroid ends the run.
import {
  burst,
  clamp,
  held,
  drawParticles,
  drawPops,
  rand,
  rect,
  sprite,
  updateParticles,
  updatePops,
  withAlpha,
  type Game,
  type Particle,
  type Pop,
} from './kit.ts'

const ROCKET = [
  '.ww......',
  'wwwwwwww.',
  'wwbbwwwwr',
  'wwwwwwww.',
  '.ww......',
]
const RX = 30 // rocket's x position
const FLY_SPEED = 150 // px/s while you hold ↑ or ↓
const FLY_RESPONSE = 28 // how fast it gets up to speed or stops (per second): ~0.1s, so it feels snappy
const RW = 18
const RH = 10

interface Rock {
  x: number
  y: number
  r: number
  speed: number
  spin: number
}
interface Star {
  x: number
  y: number
  taken: boolean
}
interface S {
  y: number
  vy: number
  rocks: Rock[]
  stars: Star[]
  bg: { x: number; y: number; z: number }[]
  rockIn: number
  starIn: number
  score: number
  best: number
  pops: Pop[]
  sparks: Particle[]
  dead: number
  t: number
  over: boolean
}

export const rocket: Game<S> = {
  name: 'rocket',
  init: (c) => ({
    y: c.h / 2,
    vy: 0,
    rocks: [],
    stars: [],
    bg: Array.from({ length: 24 }, () => ({ x: rand(0, c.w), y: rand(0, c.h), z: rand(0.2, 1) })),
    rockIn: 0.3,
    starIn: 0.8,
    score: 0,
    best: 0,
    pops: [],
    sparks: [],
    dead: 0,
    t: 0,
    over: false,
  }),
  score: (s) => Math.floor(s.score),
  over: (s) => s.over,
  update(s, dt, c) {
    s.t += dt
    for (const b of s.bg) {
      b.x -= 40 * b.z * dt
      if (b.x < 0) {
        b.x = c.w
        b.y = rand(0, c.h)
      }
    }
    for (const r of s.rocks) {
      r.x -= r.speed * dt
      r.spin += dt
    }
    for (const st of s.stars) st.x -= 70 * dt
    s.rocks = s.rocks.filter((r) => r.x > -20)
    s.stars = s.stars.filter((st) => st.x > -10 && !st.taken)
    s.sparks = updateParticles(s.sparks, dt)
    s.pops = updatePops(s.pops, dt)

    s.rockIn -= dt
    if (s.rockIn <= 0) {
      s.rocks.push({ x: c.w + 10, y: rand(5, c.h - 5), r: rand(3, 6), speed: rand(60, 110), spin: 0 })
      s.rockIn = rand(0.6, 1.1)
    }
    s.starIn -= dt
    if (s.starIn <= 0) {
      s.stars.push({ x: c.w + 5, y: rand(6, c.h - 6), taken: false })
      s.starIn = rand(0.8, 1.6)
    }

    if (s.over) return
    if (s.dead > 0) {
      s.dead -= dt
      if (s.dead <= 0 && c.input) {
        s.over = true
        return
      }
      if (s.dead <= 0) {
        s.score = 0
        s.y = c.h / 2
        s.vy = 0
      }
      return
    }

    if (c.input) {
      // you fly: the rocket moves while ↑ / ↓ is held and stops as soon as you let go — no drifting
      const dir = (held(c, 'down') ? 1 : 0) - (held(c, 'up') ? 1 : 0)
      s.vy += (dir * FLY_SPEED - s.vy) * clamp(dt * FLY_RESPONSE, 0, 1)
      s.y = clamp(s.y + s.vy * dt, RH / 2, c.h - RH / 2)
    }
    // steering (the bot)
    let force = 0
    let threat = false
    for (const r of s.rocks) {
      const dx = r.x - (RX + RW)
      if (dx < -RW - r.r || dx > 120) continue
      const dy = s.y - r.y
      const clearance = Math.abs(dy) - r.r - RH / 2 // how far we'd pass from its edge
      if (clearance > 14) continue
      const urgency = 1 - Math.max(0, dx) / 120
      if (dx < 60) threat = true
      // dodge toward the side with more room when a rock is dead ahead
      const away = Math.abs(dy) < 2 ? (s.y < c.h / 2 ? 1 : -1) : Math.sign(dy)
      force += (away * urgency * 2600) / (Math.max(0, clearance) + 3)
    }
    const star = s.stars.find((st) => st.x > RX)
    if (star && !threat) force += (star.y - s.y) * 4
    force += (c.h / 2 - s.y) * 0.8 // drift back to the middle
    // walls
    if (s.y < 8) force += 200
    if (s.y > c.h - 8) force -= 200
    if (!c.input) {
      s.vy = clamp(s.vy + force * dt, -160, 160) * Math.pow(0.05, dt)
      s.y = clamp(s.y + s.vy * dt, RH / 2, c.h - RH / 2)
    }

    // collisions
    for (const st of s.stars) {
      if (!st.taken && Math.abs(st.x - (RX + RW / 2)) < 10 && Math.abs(st.y - s.y) < 8) {
        st.taken = true
        s.score += 10
        s.best = Math.max(s.best, s.score)
        s.pops.push({ x: st.x, y: st.y - 4, t: 0 })
      }
    }
    for (const r of s.rocks) {
      const cx = clamp(r.x, RX, RX + RW)
      const cy = clamp(r.y, s.y - RH / 2, s.y + RH / 2)
      if (Math.hypot(r.x - cx, r.y - cy) < r.r - 0.5) {
        s.dead = 1.1
        s.sparks.push(...burst(RX + RW / 2, s.y, ['#ff9f0a', '#ffd60a', '#ff453a', '#ffffff'], 22, 90))
        break
      }
    }
    if (s.dead <= 0) s.score += dt * 2 // a little for surviving
    s.best = Math.max(s.best, Math.floor(s.score))
  },
  draw(s, c) {
    const { ctx } = c
    for (const b of s.bg) withAlpha(c, 0.25 + b.z * 0.5, () => rect(c, b.x, b.y, b.z > 0.7 ? 2 : 1, b.z > 0.7 ? 2 : 1, c.ink))
    for (const st of s.stars) {
      const tw = 0.6 + 0.4 * Math.sin(s.t * 10 + st.x)
      withAlpha(c, tw, () => {
        rect(c, st.x - 1, st.y - 3, 2, 6, '#ffd60a')
        rect(c, st.x - 3, st.y - 1, 6, 2, '#ffd60a')
      })
    }
    for (const r of s.rocks) {
      ctx.fillStyle = '#8e8e93'
      ctx.beginPath()
      // lumpy rock: a polygon with a few wobbly vertices
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + r.spin
        const rr = r.r * (0.8 + 0.25 * Math.sin(i * 2.3 + r.r))
        ctx[i ? 'lineTo' : 'moveTo'](r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr)
      }
      ctx.fill()
      withAlpha(c, 0.35, () => rect(c, r.x - 1, r.y - 1, 2, 2, '#3a3a3c'))
    }
    if (s.dead <= 0) {
      // flame
      const f = Math.floor(s.t * 20) % 2
      rect(c, RX - 4 - f * 2, s.y - 1, 4 + f * 2, 2, '#ff9f0a')
      rect(c, RX - 2, s.y - 2, 2, 4, '#ffd60a')
      sprite(c, ROCKET, { w: '#e6e9ef', b: '#32ade6', r: c.accent }, RX, s.y - RH / 2)
    }
    drawParticles(c, s.sparks)
    drawPops(c, s.pops)
  },
}
