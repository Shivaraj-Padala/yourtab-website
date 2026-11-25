// The typefaces YourTab offers (src/app/settings/fonts.ts in the extension). The page only ships
// Geist; the others load the first time someone picks them in the playground.
const SYSTEM = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

export const FONTS = [
  { id: 'system', label: 'System', family: SYSTEM, load: null },
  { id: 'inter', label: 'Inter', family: `'Inter Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/inter/wght.css') },
  { id: 'geist', label: 'Geist', family: `'Geist Variable', ${SYSTEM}`, load: null },
  { id: 'noto-sans', label: 'Noto Sans', family: `'Noto Sans Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/noto-sans/wght.css') },
  { id: 'nunito-sans', label: 'Nunito Sans', family: `'Nunito Sans Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/nunito-sans/wght.css') },
  { id: 'figtree', label: 'Figtree', family: `'Figtree Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/figtree/wght.css') },
  { id: 'roboto', label: 'Roboto', family: `'Roboto Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/roboto/wght.css') },
  { id: 'raleway', label: 'Raleway', family: `'Raleway Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/raleway/wght.css') },
  { id: 'outfit', label: 'Outfit', family: `'Outfit Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/outfit/wght.css') },
  { id: 'montserrat', label: 'Montserrat', family: `'Montserrat Variable', ${SYSTEM}`, load: () => import('@fontsource-variable/montserrat/wght.css') },
] as const

export type FontId = (typeof FONTS)[number]['id']

export const fontFamily = (id: FontId) => FONTS.find((f) => f.id === id)!.family

/** Fetch a typeface's CSS (and, through it, its font file) the first time it's needed. */
export function loadFont(id: FontId) {
  void FONTS.find((f) => f.id === id)?.load?.()
}
