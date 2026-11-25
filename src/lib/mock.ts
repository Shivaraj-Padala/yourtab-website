// What the mock new tab page can show: the extension's own settings, and its defaults.
import type { FontId } from './fonts'
import type { WallpaperId } from './wallpapers'

export type DisplayStyle = 'shimmer' | 'aurora' | 'glow' | 'spotlight' | 'static'

/** Display Text palettes (DISPLAY_PALETTES in the extension). `accent` is derived from the accent. */
export const PALETTES = [
  { id: 'accent', name: 'Accent', colors: null },
  { id: 'sunset', name: 'Sunset', colors: ['#ff5e62', '#ff9966', '#e8467c'] },
  { id: 'rosegold', name: 'Rose Gold', colors: ['#d4697a', '#e0956a', '#c25a80'] },
  { id: 'berry', name: 'Berry', colors: ['#e03e7d', '#ae3ec9', '#f0457a'] },
  { id: 'cosmic', name: 'Cosmic', colors: ['#7048e8', '#e64980', '#4c6ef5'] },
  { id: 'lavender', name: 'Lavender', colors: ['#9775fa', '#cc5de8', '#748ffc'] },
  { id: 'ocean', name: 'Ocean', colors: ['#1c7ed6', '#15aabf', '#5c7cfa'] },
  { id: 'borealis', name: 'Borealis', colors: ['#12b886', '#228be6', '#7950f2'] },
  { id: 'lagoon', name: 'Lagoon', colors: ['#0ca678', '#15aabf', '#20c997'] },
  { id: 'citrus', name: 'Citrus', colors: ['#f76707', '#f59f00', '#74b816'] },
  { id: 'gold', name: 'Gold', colors: ['#c0841f', '#e0aa3e', '#b07422'] },
  { id: 'steel', name: 'Steel', colors: ['#64788f', '#9fb2c6', '#6a7f97'] },
] as const
export type PaletteId = (typeof PALETTES)[number]['id']

export interface MockSettings {
  theme: 'light' | 'dark' | 'auto'
  accent: string
  glass: boolean
  font: FontId
  wallpaper: WallpaperId
  /** dim and blur for the video wallpaper (0–0.8, px) */
  dim: number
  blur: number
  layout: 'grid' | 'dock'
  shape: 'squircle' | 'circle'
  /** Display Text; empty shows "Your Name", like the extension */
  text: string
  style: DisplayStyle
  palette: PaletteId
  clock24: boolean
  face: boolean
}

/** A fresh install (settings/schema.ts DEFAULT_SETTINGS). */
export const DEFAULT_MOCK: MockSettings = {
  theme: 'auto',
  accent: '#fb542b',
  glass: true,
  font: 'system',
  wallpaper: 'plain',
  dim: 0.3,
  blur: 0,
  layout: 'grid',
  shape: 'squircle',
  text: '',
  style: 'shimmer',
  palette: 'accent',
  clock24: true,
  face: false,
}
