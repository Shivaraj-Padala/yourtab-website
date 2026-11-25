// YourTab's wallpapers, ported from the extension (src/app/settings/background.ts and schema.ts):
// the curated gradients with their exact CSS, the plain colors, the Default gradient and video.
import { asset } from '../config'
import { luminance } from './color'

export interface GradientDef {
  name: string
  /** Dark gradients get light text, light ones dark text. */
  dark: boolean
  css: string
}

/** A wide, soft pool of light: an ellipse `w`×`h` (in %) centered at x, y, fading to nothing. */
const glow = (x: number, y: number, color: string, w = 70, h = 60) =>
  `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y}%, ${color} 0%, transparent 100%)`
/** Darkens the edges a little, like a lens — keeps the eye on the middle of the page. */
const vignette = (strength: number) => `radial-gradient(ellipse 120% 95% at 50% 45%, transparent 55%, rgba(0, 0, 0, ${strength}) 100%)`
/** Very faint film grain: texture, and no visible banding in the large soft gradients. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .045'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\") 0 0 / 180px 180px repeat"
/** Layers listed top first: grain, vignette, glows, then the base color (or a base gradient). */
const mesh = (base: string, vignetteStrength: number, ...glows: string[]) => [GRAIN, vignette(vignetteStrength), ...glows, base].join(', ')

export const GRADIENTS = {
  // ── light: soft, warm-neutral, like fine paper and natural light ──
  champagne: {
    name: 'Champagne',
    dark: false,
    css: mesh('linear-gradient(160deg, #faf6f0, #efe5d6)', 0.06, glow(18, 8, '#fffaf2', 70, 55), glow(85, 20, '#ecd8b6cc', 60, 55), glow(30, 100, '#f2d9cccc', 75, 50)),
  },
  porcelain: {
    name: 'Porcelain',
    dark: false,
    css: mesh('linear-gradient(170deg, #f6f8fb, #e6ebf2)', 0.05, glow(20, 0, '#ffffff', 75, 55), glow(90, 30, '#d6e2f2cc', 55, 60), glow(15, 95, '#e6e0f0bb', 65, 50)),
  },
  dune: {
    name: 'Dune',
    dark: false,
    css: mesh('linear-gradient(175deg, #f7efe4, #e9d6c0)', 0.07, glow(50, -5, '#fff8ef', 90, 50), glow(95, 85, '#e0b893bb', 60, 55), glow(5, 75, '#ecd3bdbb', 55, 55)),
  },
  sage: {
    name: 'Sage',
    dark: false,
    css: mesh('linear-gradient(165deg, #f2f4ef, #dfe6dc)', 0.06, glow(15, 10, '#fbfcf9', 70, 55), glow(85, 25, '#cddbc9cc', 60, 55), glow(60, 105, '#d9e5e2cc', 80, 50)),
  },
  rose: {
    name: 'Rosé',
    dark: false,
    css: mesh('linear-gradient(160deg, #fbf3f1, #f0dcd8)', 0.06, glow(20, 5, '#fff9f7', 70, 55), glow(88, 30, '#ebc5c2bb', 60, 60), glow(25, 100, '#f2dcc8bb', 70, 50)),
  },
  pearl: {
    name: 'Pearl',
    dark: false,
    css: mesh('linear-gradient(150deg, #f5f4f8, #e8e7ee)', 0.05, glow(10, 15, '#e6defabb', 60, 55), glow(90, 20, '#d8eef0bb', 60, 55), glow(70, 100, '#f6e2d6bb', 70, 50), glow(40, 40, '#ffffffaa', 50, 40)),
  },
  // ── dark: deep and moody, a single light source, like a film still ──
  obsidian: {
    name: 'Obsidian',
    dark: true,
    css: mesh('linear-gradient(160deg, #121214, #070708)', 0.5, glow(15, 0, '#6b5636aa', 70, 55), glow(90, 100, '#2a221988', 60, 50)),
  },
  velvet: {
    name: 'Velvet',
    dark: true,
    css: mesh('linear-gradient(165deg, #150d14, #08060a)', 0.5, glow(80, 10, '#6e1d3acc', 65, 60), glow(10, 90, '#35184aaa', 65, 55)),
  },
  abyss: {
    name: 'Abyss',
    dark: true,
    css: mesh('linear-gradient(175deg, #07131c, #03070c)', 0.5, glow(50, -10, '#155e6ecc', 90, 60), glow(90, 95, '#10265099', 60, 50)),
  },
  cinema: {
    name: 'Cinema',
    dark: true,
    css: mesh('linear-gradient(170deg, #0a1418, #06090b)', 0.5, glow(10, 10, '#12545eaa', 65, 60), glow(95, 105, '#8a4317aa', 70, 55)),
  },
  emerald: {
    name: 'Emerald',
    dark: true,
    css: mesh('linear-gradient(165deg, #08140f, #040907)', 0.5, glow(20, 0, '#11604acc', 70, 55), glow(85, 95, '#4a3f1a88', 60, 50)),
  },
  eclipse: {
    name: 'Eclipse',
    dark: true,
    css: mesh('#060608', 0.45, glow(50, 112, '#d1844299', 75, 45), glow(50, 108, '#f4c48e55', 40, 22), glow(50, 0, '#1c1f3a88', 90, 50)),
  },
  graphite: {
    name: 'Graphite',
    dark: true,
    css: mesh('linear-gradient(170deg, #1a1c20, #0c0d10)', 0.45, glow(15, 0, '#4a515ccc', 70, 55), glow(90, 100, '#22314499', 60, 50)),
  },
} satisfies Record<string, GradientDef>

export type GradientId = keyof typeof GRADIENTS

/** Plain wallpaper colors (PLAIN_COLORS in the extension's schema.ts). */
export const PLAIN_COLORS = [
  { id: 'paper', name: 'Paper', color: '#f4efe6' },
  { id: 'mist', name: 'Mist', color: '#e7edf3' },
  { id: 'blush', name: 'Blush', color: '#f5e6e3' },
  { id: 'sage-c', name: 'Sage', color: '#e2e9de' },
  { id: 'lilac', name: 'Lilac', color: '#ebe6f3' },
  { id: 'ink', name: 'Ink', color: '#141518' },
  { id: 'navy', name: 'Navy', color: '#0f1a2c' },
  { id: 'forest', name: 'Forest', color: '#0f1f19' },
  { id: 'plum', name: 'Plum', color: '#1f1426' },
  { id: 'cocoa', name: 'Cocoa', color: '#221915' },
] as const

export const PLAIN = { light: '#ffffff', dark: '#202124' }

/** Every wallpaper the demo can show. */
export type WallpaperId = 'default' | 'plain' | 'video' | GradientId | (typeof PLAIN_COLORS)[number]['id']

export const VIDEO = { src: asset('media/wallpaper.webm'), poster: asset('media/wallpaper-poster.jpg'), name: 'Video' }

/**
 * How text sits on a wallpaper: 'theme' follows light / dark, 'plain' is the plain wallpaper
 * (dark text on white, light text on charcoal), 'light' / 'dark' are fixed text colors.
 */
export type TextTone = 'theme' | 'plain' | 'light' | 'dark'

export interface WallpaperLook {
  name: string
  /** CSS background, or null for one drawn by the mock itself (Default gradient, plain, video). */
  css: string | null
  tone: TextTone
  /** The color accent text is checked against; null when it follows the theme. */
  surface: string | null
}

export function wallpaperLook(id: WallpaperId): WallpaperLook {
  if (id === 'default') return { name: 'Default', css: null, tone: 'theme', surface: null }
  if (id === 'plain') return { name: 'Plain', css: null, tone: 'plain', surface: null }
  if (id === 'video') return { name: VIDEO.name, css: null, tone: 'light', surface: '#1b2a2b' }
  if (id in GRADIENTS) {
    const g = GRADIENTS[id as GradientId]
    return { name: g.name, css: g.css, tone: g.dark ? 'light' : 'dark', surface: g.dark ? '#121216' : '#f1ebe3' }
  }
  const c = PLAIN_COLORS.find((p) => p.id === id)!
  const dark = luminance(c.color) < 0.2
  return { name: c.name, css: c.color, tone: dark ? 'light' : 'dark', surface: c.color }
}
