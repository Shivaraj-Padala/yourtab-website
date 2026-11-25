// A small port of YourTab's color engine (src/lib/color.ts in the extension):
// any accent gets a shade of the same hue that stays readable on the surface behind it.

type Rgb = [number, number, number]

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

function rgbToHex(rgb: Rgb): string {
  return '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')
}

interface Oklch {
  l: number
  c: number
  h: number
}

function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const h = (Math.atan2(B, A) * 180) / Math.PI
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h }
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180)
  const B = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

function oklchToHex(color: Oklch): string {
  let rgb = oklchToLinear(color)
  if (!inGamut(rgb)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid
      else hi = mid
    }
    rgb = oklchToLinear({ ...color, c: lo })
  }
  return rgbToHex(rgb.map(toGamma) as Rgb)
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const ratioOf = (y1: number, y2: number) => (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05)

export const contrast = (a: string, b: string) => ratioOf(luminance(a), luminance(b))

/** The nearest shade of `hex` (same hue, only lightness moves) that reaches `ratio` on `surface`. */
export function ensureContrast(hex: string, surface: string, ratio: number): string {
  const ys = luminance(surface)
  const yc = luminance(hex)
  if (ratioOf(yc, ys) >= ratio) return hex
  const lighter = yc > ys || (yc === ys && ratioOf(1, ys) > ratioOf(0, ys))
  const ends = lighter ? [1, 0] : [0, 1]
  const target = ends.find((t) => ratioOf(t, ys) >= ratio) ?? ends[0]
  const start = hexToOklch(hex)
  const at = (l: number) => oklchToHex({ ...start, l })
  let fail = start.l
  let pass = target
  for (let i = 0; i < 24; i++) {
    const mid = (fail + pass) / 2
    if (ratioOf(luminance(at(mid)), ys) >= ratio) pass = mid
    else fail = mid
  }
  return at(pass)
}

/** YourTab's plain wallpaper in each theme (PLAIN in the extension's wallpaper/lib/background.ts). */
export const MOCK_SURFACE = { light: '#ffffff', dark: '#202124' } as const
