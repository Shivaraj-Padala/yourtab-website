// Which browser is visiting, so the install button can say "Add to Edge", "Add to Firefox"…
// Chromium browsers (Chrome, Edge, Brave, Opera, Vivaldi, Arc…) all install from the Chrome Web
// Store; Firefox has its own store; Safari isn't supported.
import { useSyncExternalStore } from 'react'
import { CHROME_WEB_STORE_URL, FIREFOX_ADDONS_URL } from '../config'

export interface BrowserInfo {
  id: 'chrome' | 'edge' | 'brave' | 'opera' | 'firefox' | 'safari' | 'other'
  /** As shown on the button: "Add to {name}". */
  name: string
  /** Where it installs from; null when the browser can't run YourTab. */
  store: string | null
}

const CHROME: BrowserInfo = { id: 'chrome', name: 'Chrome', store: CHROME_WEB_STORE_URL }

export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands?.map((b) => b.brand) ?? []
  if (/Firefox\//.test(ua)) return { id: 'firefox', name: 'Firefox', store: FIREFOX_ADDONS_URL }
  if ('brave' in navigator) return { id: 'brave', name: 'Brave', store: CHROME_WEB_STORE_URL }
  if (/Edg\//.test(ua) || brands.includes('Microsoft Edge')) return { id: 'edge', name: 'Edge', store: CHROME_WEB_STORE_URL }
  if (/OPR\//.test(ua) || brands.includes('Opera')) return { id: 'opera', name: 'Opera', store: CHROME_WEB_STORE_URL }
  if (/Chrome\/|Chromium\//.test(ua) || brands.includes('Chromium')) return CHROME
  if (/Safari\//.test(ua) && /Apple/.test(navigator.vendor)) return { id: 'safari', name: 'Safari', store: null }
  return { id: 'other', name: 'your browser', store: CHROME_WEB_STORE_URL }
}

let cached: BrowserInfo | null = null
const snapshot = () => (cached ??= detectBrowser())
const noop = () => () => {}

/** The visitor's browser. Chrome while prerendering, then the real one after hydration. */
export const useBrowser = (): BrowserInfo => useSyncExternalStore(noop, snapshot, () => CHROME)
