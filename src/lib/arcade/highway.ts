// Highway — top-down car weaving through traffic. The bot picks the lane with the most room;
// when you drive (↑ / ↓ to change lanes) the road speeds up and a crash ends the run.
import { burst, clamp, drawParticles, drawPops, pick, rand, rect, sprite, tapped, updateParticles, updatePops, withAlpha, type Game, type Particle, type Pop, type Screen } from './kit.ts'

const CAR = [
  '..k....k..',
  '.cccccccc.',
  'cccwwcccwc',
  'cccwwcccwc',
  '.cccccccc.',
  '..k....k..',
]
const CAR_W = 20
const CAR_H = 12
const TRAFFIC_COLORS = ['#32ade6', '#ffcc00', '#af52de', '#34c759', '#ff9500', '#8e8e93']

interface Car {
  x: number
  lane: number
  color: string
  passed: boolean
}
interface S {
  lanes: number
  laneH: number
  top: number
  y: number // player car center y
  lane: number
  lastSpawnLane: number
  scroll: number
  traffic: Car[]
  spawnIn: number
  distance: number
  overtakes: number
  pops: Pop[]
  sparks: Particle[]
  over: boolean
}

const laneY = (s: S, lane: number) => s.top + s.laneH * lane + s.laneH / 2
const PLAYER_X = 34
const ROAD_SPEED = 160 // px/s — constant
const TRAFFIC_SPEED = 70 // every other car cruises at this speed
const WINDOW = 70 // min spacing between cars (any lane) at spawn

export const highway: Game<S> = {
  name: 'highway',
  init(c) {
    const lanes = 3
    const laneH = Math.floor((c.h - 4) / lanes)
    const top = Math.floor((c.h - laneH * lanes) / 2)
    const s: S = { lanes, laneH, top, y: 0, lane: 1, lastSpawnLane: -1, scroll: 0, traffic: [], spawnIn: 0.4, distance: 0, overtakes: 0, pops: [], sparks: [], over: false }
    s.y = laneY(s, 1)
    return s
  },
  score: (s) => s.overtakes * 10 + Math.floor(s.distance / 100),
  over: (s) => s.over,
  update(s, dt, c: Screen) {
    s.sparks = updateParticles(s.sparks, dt)
    if (s.over) return
    // The road always moves at one speed — nobody brakes. (When you drive, it slowly speeds up.)
    const road = c.input ? ROAD_SPEED * (1 + Math.min(1.2, s.distance / 20000)) : ROAD_SPEED
    s.scroll += road * dt
    s.distance += road * dt
    s.pops = updatePops(s.pops, dt)

    // All traffic cruises at the same (slower) speed, so cars never run into each other
    // and they drift toward you at a steady pace.
    for (const car of s.traffic) {
      car.x -= (road - TRAFFIC_SPEED) * dt
      if (!car.passed && car.x + CAR_W < PLAYER_X) {
        car.passed = true
        s.overtakes++
        if (s.overtakes % 5 === 0) s.pops.push({ x: PLAYER_X + 10, y: s.y - 8, t: 0 })
      }
    }
    s.traffic = s.traffic.filter((car) => car.x > -CAR_W - 10)

    s.spawnIn -= dt
    if (s.spawnIn <= 0) {
      // Only one lane may be occupied in any stretch of road WINDOW wide, so there are
      // always two open lanes side by side and a dodge is always possible.
      const spawnX = c.w + 10
      const nearby = s.traffic.filter((t) => t.x > spawnX - WINDOW)
      if (nearby.length === 0) {
        // avoid stacking the same lane over and over
        const lanes = [...Array(s.lanes).keys()].filter((l) => l !== s.lastSpawnLane || Math.random() < 0.25)
        const lane = pick(lanes)
        s.traffic.push({ x: spawnX, lane, color: pick(TRAFFIC_COLORS), passed: false })
        s.lastSpawnLane = lane
      }
      s.spawnIn = rand(0.15, 0.45)
    }

    // AI: when a car is coming up in our lane, slide into the adjacent lane with the most room
    if (c.input) {
      // you steer: ↑ / ↓ change lanes; touching another car ends the run
      if (tapped(c, 'up')) s.lane = Math.max(0, s.lane - 1)
      if (tapped(c, 'down')) s.lane = Math.min(s.lanes - 1, s.lane + 1)
      s.y += (laneY(s, s.lane) - s.y) * clamp(dt * 14, 0, 1)
      for (const car of s.traffic) {
        if (car.x < PLAYER_X + CAR_W - 3 && car.x + CAR_W > PLAYER_X + 3 && Math.abs(laneY(s, car.lane) - s.y) < CAR_H - 2) {
          s.over = true
          s.sparks.push(...burst(PLAYER_X + CAR_W, s.y, ['#ff9f0a', '#ffd60a', '#ff453a', '#ffffff'], 22, 90))
          break
        }
      }
      return
    }

    const gapAhead = (lane: number) => {
      const ahead = s.traffic.filter((t) => t.lane === lane && t.x + CAR_W > PLAYER_X - 6)
      return ahead.length ? Math.min(...ahead.map((t) => t.x)) - (PLAYER_X + CAR_W) : 999
    }
    if (gapAhead(s.lane) < 70) {
      let best = s.lane
      let bestGap = gapAhead(s.lane)
      for (const l of [s.lane - 1, s.lane + 1]) {
        if (l < 0 || l >= s.lanes) continue
        const beside = s.traffic.some((t) => t.lane === l && t.x < PLAYER_X + CAR_W + 10 && t.x + CAR_W > PLAYER_X - 10)
        const g = gapAhead(l)
        if (!beside && g > bestGap) {
          best = l
          bestGap = g
        }
      }
      s.lane = best
    }
    s.y += (laneY(s, s.lane) - s.y) * clamp(dt * 10, 0, 1)
  },
  draw(s, c) {
    // road
    withAlpha(c, 0.06, () => rect(c, 0, s.top, c.w, s.laneH * s.lanes, c.ink))
    withAlpha(c, 0.35, () => {
      for (let l = 1; l < s.lanes; l++) {
        const y = s.top + s.laneH * l - 1
        for (let x = -(s.scroll % 24); x < c.w; x += 24) rect(c, x, y, 12, 2, c.ink)
      }
    })
    for (const car of s.traffic) sprite(c, CAR, { c: car.color, w: '#1c1c1e', k: '#1c1c1e' }, car.x, laneY(s, car.lane) - CAR_H / 2)
    // player (tilts a pixel toward the lane it's moving to)
    const tilt = clamp((laneY(s, s.lane) - s.y) / 6, -1, 1)
    sprite(c, CAR, { c: c.accent, w: '#cfe8ff', k: '#1c1c1e' }, PLAYER_X, s.y - CAR_H / 2 + tilt)
    // exhaust puffs
    withAlpha(c, 0.3, () => rect(c, PLAYER_X - 4 - ((s.scroll / 6) % 4), s.y - 1, 2, 2, c.ink))
    drawParticles(c, s.sparks)
    drawPops(c, s.pops)
  },
}
