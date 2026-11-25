// Jumper — an endless side-scrolling platformer. The level is generated as you go:
// ground runs, gaps, floating platforms, coin arcs and wandering critters.
// The bot jumps gaps, hops onto platforms, stomps critters and grabs coins — or you do
// (Space / ↑ to jump; a gap or a critter to the face ends the run).
import { burst, drawParticles, drawPops, rand, rect, sprite, tapped, updateParticles, updatePops, withAlpha, type Game, type Particle, type Pop, type Screen } from './kit.ts'

const TILE = 8
const SPEED = 62
const GRAVITY = 720
const JUMP = -195
const HERO_SX = 40 // hero's screen x
const HERO_W = 12
const HERO_H = 14

const HERO_RUN = [
  ['..aaa.', '.aaaaa', '.ssses', '.sssss', '..www.', '.wwww.', '..p.p.'],
  ['..aaa.', '.aaaaa', '.ssses', '.sssss', '..www.', '.wwww.', '.p...p'],
]
const HERO_JUMP = ['..aaa.', '.aaaaa', '.ssses', '.sssss', 'w.www.', '.wwwww', '..pp..']
const CRITTER = [
  ['.ccc.', 'cecec', 'ccccc', 'c.c.c'],
  ['.ccc.', 'cecec', 'ccccc', '.c.c.'],
]

interface Col {
  ground: boolean
  platform: boolean
}
interface Coin {
  x: number
  y: number
  taken: boolean
}
interface Critter {
  x: number
  dir: number
  dead: number // > 0 = squashed, counting down
}
interface S {
  cols: Col[]
  coins: Coin[]
  critters: Critter[]
  x: number // hero world x (left edge)
  y: number // hero feet y
  vy: number
  onGround: boolean
  hurt: number
  coinsGot: number
  stomps: number
  pops: Pop[]
  sparks: Particle[]
  t: number
  groundTop: number
  platTop: number
  over: boolean
}

function gen(s: S) {
  const at = s.cols.length
  const add = (ground: boolean, platform = false) => s.cols.push({ ground, platform })
  const kind = at < 8 ? 'run' : Math.random()
  if (kind === 'run' || (typeof kind === 'number' && kind < 0.3)) {
    const n = Math.floor(rand(4, 8))
    for (let i = 0; i < n; i++) add(true)
    if (n >= 6 && at > 8) s.critters.push({ x: (at + n - 2) * TILE, dir: -1, dead: 0 })
  } else if (kind < 0.55) {
    for (let i = 0; i < 2; i++) add(true)
    const gap = Math.random() < 0.5 ? 2 : 3
    for (let i = 0; i < gap; i++) add(false)
    for (let i = 0; i < 3; i++) add(true)
  } else if (kind < 0.8) {
    // floating platform with coins on top
    for (let i = 0; i < 2; i++) add(true)
    const len = 4
    for (let i = 0; i < len; i++) {
      add(true, true)
      if (i > 0 && i < len - 1) s.coins.push({ x: (at + 2 + i) * TILE + 2, y: s.platTop - 8, taken: false })
    }
    for (let i = 0; i < 2; i++) add(true)
  } else {
    // coin arc over flat ground — grab it with a jump
    for (let i = 0; i < 7; i++) add(true)
    for (let i = 0; i < 4; i++) {
      const lift = Math.sin(((i + 0.5) / 4) * Math.PI) * 8
      s.coins.push({ x: (at + 2 + i) * TILE + 2, y: s.groundTop - 12 - lift, taken: false })
    }
  }
}

const colAt = (s: S, wx: number) => s.cols[Math.floor(wx / TILE)]
const solidAt = (s: S, wx: number) => colAt(s, wx)?.ground ?? true

export const jumper: Game<S> = {
  name: 'jumper',
  init(c: Screen) {
    const groundTop = c.h - 8
    const s: S = {
      cols: [],
      coins: [],
      critters: [],
      x: 2 * TILE,
      y: groundTop,
      vy: 0,
      onGround: true,
      hurt: 0,
      coinsGot: 0,
      stomps: 0,
      pops: [],
      sparks: [],
      t: 0,
      groundTop,
      platTop: groundTop - 2 * TILE,
      over: false,
    }
    return s
  },
  score: (s) => Math.floor(s.x / TILE) + s.coinsGot * 10 + s.stomps * 25,
  over: (s) => s.over,
  update(s, dt, c) {
    if (s.over) {
      s.sparks = updateParticles(s.sparks, dt, 200) // let the crash settle
      return
    }
    s.t += dt
    const cam = s.x - HERO_SX
    while (s.cols.length * TILE < cam + c.w + 8 * TILE) gen(s)
    s.pops = updatePops(s.pops, dt)
    s.sparks = updateParticles(s.sparks, dt, 200)
    s.hurt = Math.max(0, s.hurt - dt)

    // critters patrol, turning at edges
    for (const cr of s.critters) {
      if (cr.dead > 0) {
        cr.dead -= dt
        continue
      }
      const nx = cr.x + cr.dir * 14 * dt
      if (!solidAt(s, nx + (cr.dir > 0 ? 10 : 0))) cr.dir *= -1
      else cr.x = nx
    }
    s.critters = s.critters.filter((cr) => cr.x > cam - 20 && cr.dead >= 0)

    // ── you jump, or the AI decides ──
    if (c.input) {
      if (s.onGround && tapped(c, 'up', 'action')) {
        s.vy = JUMP
        s.onGround = false
      }
    } else if (s.onGround) {
      const front = s.x + HERO_W
      const gapAhead = !solidAt(s, front + 3)
      const platAhead = colAt(s, front + 10)?.platform && !colAt(s, front)?.platform && s.y >= s.groundTop - 1
      const critterAhead = s.critters.some((cr) => cr.dead === 0 && cr.x - front > 0 && cr.x - front < 20)
      const coinAhead = s.coins.some((co) => !co.taken && co.x - front > 4 && co.x - front < 14 && co.y < s.y - HERO_H)
      if (gapAhead || platAhead || critterAhead || coinAhead) {
        s.vy = JUMP
        s.onGround = false
      }
    }

    // ── physics ──
    s.x += SPEED * dt
    const prevY = s.y
    s.vy += GRAVITY * dt
    s.y += s.vy * dt
    s.onGround = false
    const footL = s.x + 3
    const footR = s.x + HERO_W - 3
    if (s.vy >= 0) {
      const onPlat = (colAt(s, footL)?.platform || colAt(s, footR)?.platform) && prevY <= s.platTop + 0.5 && s.y >= s.platTop
      const onGroundTile = (solidAt(s, footL) || solidAt(s, footR)) && prevY <= s.groundTop + 0.5 && s.y >= s.groundTop
      if (onPlat) {
        s.y = s.platTop
        s.vy = 0
        s.onGround = true
      } else if (onGroundTile) {
        s.y = s.groundTop
        s.vy = 0
        s.onGround = true
      }
    }
    // fell in a gap → your run ends; the bot respawns a little further on
    if (s.y > c.h + 30 && c.input) {
      s.over = true
      return
    }
    if (s.y > c.h + 30) {
      let wx = s.x + TILE * 2
      while (!solidAt(s, wx) || !solidAt(s, wx + HERO_W)) wx += TILE
      s.x = wx
      s.y = s.groundTop - 20
      s.vy = 0
      s.hurt = 1
    }

    // coins
    for (const co of s.coins) {
      if (!co.taken && co.x + 4 > s.x && co.x < s.x + HERO_W && co.y + 4 > s.y - HERO_H && co.y < s.y) {
        co.taken = true
        s.coinsGot++
        s.pops.push({ x: co.x - cam, y: co.y, t: 0 })
      }
    }
    s.coins = s.coins.filter((co) => co.x > cam - 10 && !co.taken)

    // critters: stomp from above, bump from the side
    for (const cr of s.critters) {
      if (cr.dead !== 0) continue
      const top = s.groundTop - 8
      const overlap = s.x + HERO_W - 2 > cr.x && s.x + 2 < cr.x + 10 && s.y > top
      if (!overlap) continue
      if (s.vy > 0 && prevY <= top + 4) {
        cr.dead = 0.6
        s.vy = JUMP * 0.7
        s.stomps++
        s.pops.push({ x: cr.x - cam + 5, y: top - 6, t: 0 })
        s.sparks.push(...burst(cr.x - cam + 5, top + 4, ['#af52de', '#ffffff'], 8, 50))
      } else if (c.input) {
        s.over = true
        s.sparks.push(...burst(HERO_SX + HERO_W / 2, s.y - HERO_H / 2, [c.accent, '#ffffff'], 16, 70))
      } else if (s.hurt <= 0) {
        s.hurt = 1
        s.vy = JUMP * 0.6
      }
    }
    for (const cr of s.critters) if (cr.dead > 0 && cr.dead - dt <= 0) cr.dead = -1
  },
  draw(s, c) {
    const cam = s.x - HERO_SX
    // parallax hills + clouds
    withAlpha(c, 0.07, () => {
      c.ctx.fillStyle = c.ink
      for (let i = -1; i < 5; i++) {
        const hx = i * 90 - ((cam * 0.3) % 90)
        c.ctx.beginPath()
        c.ctx.arc(hx, c.h - 4, 30, Math.PI, 0)
        c.ctx.fill()
      }
    })
    withAlpha(c, 0.18, () => {
      for (let i = -1; i < 4; i++) {
        const cx = i * 120 - ((cam * 0.15) % 120) + 30
        rect(c, cx, 8, 18, 4, c.ink)
        rect(c, cx + 4, 5, 9, 3, c.ink)
      }
    })

    // terrain
    const first = Math.max(0, Math.floor(cam / TILE))
    for (let i = first; i < first + Math.ceil(c.w / TILE) + 2 && i < s.cols.length; i++) {
      const col = s.cols[i]
      const x = i * TILE - cam
      if (col.ground) {
        rect(c, x, s.groundTop, TILE, c.h - s.groundTop, '#a0703c')
        rect(c, x, s.groundTop, TILE, 2, '#34c759')
        if (i % 3 === 0) rect(c, x + 3, s.groundTop + 4, 1, 1, '#7a5530')
      }
      if (col.platform) {
        rect(c, x, s.platTop, TILE, 4, '#c98a4b')
        rect(c, x, s.platTop + 3, TILE, 1, '#8a5a2b')
        rect(c, x + TILE - 1, s.platTop, 1, 4, '#8a5a2b')
      }
    }
    // coins (spinning)
    for (const co of s.coins) {
      const w = Math.max(1, Math.round(Math.abs(Math.cos(s.t * 5 + co.x)) * 4))
      rect(c, co.x - cam + (4 - w) / 2, co.y, w, 4, '#ffd60a')
    }
    // critters
    for (const cr of s.critters) {
      if (cr.dead > 0) withAlpha(c, cr.dead / 0.6, () => rect(c, cr.x - cam, s.groundTop - 2, 10, 2, '#af52de'))
      else if (cr.dead === 0) sprite(c, CRITTER[Math.floor(s.t * 6) % 2], { c: '#af52de', e: '#ffffff' }, cr.x - cam, s.groundTop - 8)
    }
    // hero (blinks after a bump)
    if (!(s.hurt > 0 && Math.floor(s.hurt * 12) % 2 === 0)) {
      const frame = s.onGround ? HERO_RUN[Math.floor(s.t * 10) % 2] : HERO_JUMP
      sprite(c, frame, { a: c.accent, s: '#f1c27d', e: '#1c1c1e', w: '#e6e9ef', p: '#3d5a80' }, HERO_SX, s.y - HERO_H)
    }
    drawParticles(c, s.sparks)
    drawPops(c, s.pops)
  },
}
