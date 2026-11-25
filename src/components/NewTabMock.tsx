// YourTab's new tab page inside a browser window, rebuilt in HTML/CSS from the extension's own
// styles (src/app/App.css, glass.css, shortcuts.css, display.css, background.ts) and driven by the
// same settings: wallpaper, theme, accent, glass, font, grid or dock, icon shape, Display Text,
// clock and the Face. The page is laid out at the size of a 1280 × 760 window and scaled down as
// one piece, so every value in mock.css matches the extension's (see --px there).
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { asset } from '../config'
import { contrast, ensureContrast, MOCK_SURFACE } from '../lib/color'
import { fontFamily } from '../lib/fonts'
import { textWidth } from '../lib/flyingKeys'
import { formatDate, useNow, useReducedMotion } from '../lib/hooks'
import { useInView } from '../lib/useInView'
import { DEFAULT_MOCK, PALETTES, type MockSettings } from '../lib/mock'
import { faceFeeder, useTypingDemo } from '../lib/typingDemo'
import { VIDEO, wallpaperLook } from '../lib/wallpapers'
import { FaceSvg } from './FaceSvg'

interface Props {
  settings?: Partial<MockSettings>
  /** Play the "new tab opening" sequence (styles/motion.css) when it first shows. */
  intro?: boolean
  /** With the Face on, type into the search bar and let it eat the flying keys. */
  feedDemo?: boolean
  label: string
  className?: string
}

type Kind = 'link' | 'folder' | 'notes' | 'todos'
/** The home screen a fresh install starts with, shown as the extension's letter tiles. */
const ITEMS: { title: string; kind: Kind }[] = [
  { title: 'GitHub', kind: 'link' },
  { title: 'YouTube', kind: 'link' },
  { title: 'Mail', kind: 'link' },
  { title: 'Social', kind: 'folder' },
  { title: 'Wikipedia', kind: 'link' },
  { title: 'Notes', kind: 'notes' },
  { title: 'To-dos', kind: 'todos' },
]

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Lucide "square-text" and "square-check", filled (AppArt.tsx in the extension). */
function AppArt({ app }: { app: 'notes' | 'todos' }) {
  const id = useId()
  const [a, b] = app === 'notes' ? ['#ffc93d', '#ff9f1a'] : ['#6b8cff', '#3d63f5']
  return (
    <svg viewBox="0 0 24 24" className="nt-app-art">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill={`url(#${id}g)`} />
      {app === 'notes' ? (
        <path d="M7 8h8M7 12h10M7 16h6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function Icon({ kind, title }: { kind: Kind; title: string }) {
  if (kind === 'folder')
    return (
      <span className="nt-icon sq nt-folder">
        {['R', 'X', 'I'].map((l, k) => (
          <span key={l} style={{ '--k': k } as CSSProperties}>
            {l}
          </span>
        ))}
      </span>
    )
  if (kind === 'notes' || kind === 'todos')
    return (
      <span className="nt-icon sq nt-app">
        <AppArt app={kind} />
      </span>
    )
  return <span className="nt-icon sq nt-mono">{title[0]}</span>
}

/** The video wallpaper: plays only while on screen, and not at all with reduced motion. */
function VideoWall({ dim, blur }: { dim: number; blur: number }) {
  const [wrap, inView] = useInView<HTMLDivElement>('200px')
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true // React doesn't render `muted` as an attribute, and autoplay needs it
    if (inView && !reduced) void v.play().catch(() => {})
    else v.pause()
  }, [inView, reduced])
  return (
    <div className="nt-video-wrap" ref={wrap}>
      <video
        ref={ref}
        className="nt-video"
        poster={VIDEO.poster}
        src={VIDEO.src}
        loop
        playsInline
        preload="metadata"
        style={blur ? { filter: `blur(calc(${blur} * var(--px)))` } : undefined}
        // recorded WebM may not know its length; restart by hand if `loop` doesn't
        onEnded={(e) => {
          e.currentTarget.currentTime = 0
          void e.currentTarget.play().catch(() => {})
        }}
      />
      <div className="nt-dim" style={{ opacity: dim }} />
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
function timeText(d: Date | null, clock24: boolean) {
  const h = d ? d.getHours() : 9
  const m = d ? d.getMinutes() : 41
  if (clock24) return `${pad(h)}:${pad(m)}`
  return `${pad(h % 12 || 12)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

const GAMEPAD =
  'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z'
const GEAR =
  'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915'

export function NewTabMock({ settings, intro = false, feedDemo = false, label, className = '' }: Props) {
  const s = { ...DEFAULT_MOCK, ...settings }
  const now = useNow()
  // The opening sequence plays once. Afterwards the class goes, so things that appear later
  // (switching to the dock, turning the Face off) show straight away instead of replaying it.
  const [introDone, setIntroDone] = useState(false)
  const introTimer = useRef(0)
  useEffect(() => () => clearTimeout(introTimer.current), [])

  // With the Face on, the search bar types by itself and the Face eats the keys (flyingKeys.ts).
  const [root, inView] = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const page = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const barText = useRef<HTMLSpanElement>(null)
  const faceSvg = useRef<SVGSVGElement>(null)
  const feeder = useRef<{ svg: SVGSVGElement | null; f: ReturnType<typeof faceFeeder> } | null>(null)
  const feed = () => {
    if (feeder.current?.svg !== faceSvg.current) feeder.current = { svg: faceSvg.current, f: faceFeeder(faceSvg.current) }
    return feeder.current!.f
  }
  const [typed, setTyped] = useState('')
  const scale = () => (page.current?.clientWidth ?? 1280) / 1280
  useTypingDemo({
    active: feedDemo && !!settings?.face && inView && !reduced,
    script: ['cookies', 'pizza', 'hello'],
    layer: page,
    skin: settings?.accent ?? DEFAULT_MOCK.accent,
    setText: setTyped,
    scale,
    mouth: () => (page.current ? feed().point(page.current) : null),
    onIncoming: () => feed().incoming(),
    onEaten: () => feed().eaten(),
    caret: (t) => {
      const p = page.current?.getBoundingClientRect()
      const b = bar.current?.getBoundingClientRect()
      const tx = barText.current
      if (!p || !b || !tx) return null
      const pad = parseFloat(getComputedStyle(tx).paddingLeft) || 0
      return { x: tx.getBoundingClientRect().left - p.left + pad + textWidth(tx, t), y: b.top - p.top + 4 * scale() }
    },
  })
  const look = wallpaperLook(s.wallpaper)

  // The Face fills the page with the accent and takes the place of the clock and Display Text.
  const faceTone = contrast('#111111', s.accent) >= contrast('#ffffff', s.accent) ? 'dark' : 'light'
  const tone = s.face ? faceTone : look.tone
  // accent text uses a shade that reads on the wallpaper that's showing (--accent-ink-p)
  const surface = s.face ? s.accent : look.surface
  const inkL = ensureContrast(s.accent, surface ?? MOCK_SURFACE.light, 4.5)
  const inkD = ensureContrast(s.accent, surface ?? MOCK_SURFACE.dark, 4.5)

  const palette = PALETTES.find((p) => p.id === s.palette)?.colors
  const text = s.text.trim() || 'Your Name'

  const style = {
    '--accent': s.accent,
    '--ink-l': inkL,
    '--ink-d': inkD,
    '--mock-font': fontFamily(s.font),
    '--len': Math.max(9, text.length),
    ...(palette && { '--c1': palette[0], '--c2': palette[1], '--c3': palette[2] }),
  } as CSSProperties

  const dock = s.layout === 'dock'

  return (
    <div
      ref={root}
      className={`mock${intro && !introDone ? ' mock--intro' : ''} ${className}`}
      onAnimationStart={(e) => {
        if (e.animationName === 'window-rise') introTimer.current = window.setTimeout(() => setIntroDone(true), 3000)
      }}
      data-theme={s.theme === 'auto' ? undefined : s.theme}
      data-glass={s.glass ? 'on' : 'off'}
      data-wallpaper={s.face ? 'face' : look.css ? 'css' : s.wallpaper}
      data-tone={tone}
      data-shape={s.shape}
      data-palette={palette ? 'named' : 'accent'}
      style={style}
      role="img"
      aria-label={label}
    >
      <div className="mock-window">
        <div className="mock-titlebar">
          <span className="mock-lights">
            <i />
            <i />
            <i />
          </span>
          <span className="mock-tab">
            <img src={asset('favicon.svg')} alt="" width="16" height="16" />
            <span>YourTab</span>
            <svg className="mock-tab-x" viewBox="0 0 10 10">
              <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
          <span className="mock-tab-plus">+</span>
        </div>
        <div className="mock-toolbar">
          <span className="mock-arrows">
            <svg viewBox="0 0 24 24">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            <svg viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <svg viewBox="0 0 24 24">
              <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
            </svg>
          </span>
          <span className="mock-omnibox">
            <span>Search or type a URL</span>
          </span>
        </div>

        <div className="mock-page" ref={page}>
          <div className="nt-bg" style={!s.face && look.css ? { background: look.css } : undefined} />
          {!s.face && s.wallpaper === 'video' && <VideoWall dim={s.dim} blur={s.blur} />}
          {s.face && (
            <div className="nt-face">
              <FaceSvg svgRef={faceSvg} />
            </div>
          )}

          <div className="nt-corner">
            <span className="nt-btn">
              <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.75}>
                <line x1="6" x2="10" y1="11" y2="11" />
                <line x1="8" x2="8" y1="9" y2="13" />
                <line x1="15" x2="15.01" y1="12" y2="12" />
                <line x1="18" x2="18.01" y1="10" y2="10" />
                <path d={GAMEPAD} />
              </svg>
            </span>
            <span className="nt-btn">
              <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.75}>
                <path d={GEAR} />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
          </div>

          <div className={`nt-page${dock ? ' nt-page--dock' : ''}${s.face ? ' nt-page--face' : ''}`}>
            {!s.face && (
              <>
                <div className="nt-clock">
                  <span className="nt-time">{timeText(now, s.clock24)}</span>
                  <span className="nt-date">{formatDate(now).replace(',', '')}</span>
                </div>
                <div className="nt-display">
                  <span className={`nt-dt dt-${s.style}`} data-text={text}>
                    <span className="nt-dt-text">{text}</span>
                  </span>
                </div>
              </>
            )}

            <div className="nt-search" ref={bar}>
              <svg className="nt-search-icon" viewBox="0 0 24 24" {...stroke}>
                <path d="m21 21-4.34-4.34" />
                <circle cx="11" cy="11" r="8" />
              </svg>
              <span className={`nt-placeholder${typed ? ' is-typed' : ''}`} ref={barText}>
                {typed || 'Search anything…'}
              </span>
              <span className="nt-kbd">/</span>
            </div>

            {!dock && (
              <ul className="nt-grid">
                {ITEMS.map((item, n) => (
                  <li key={item.title} className="nt-tile" style={{ '--n': n } as CSSProperties}>
                    <Icon kind={item.kind} title={item.title} />
                    <span className="nt-label">{item.title}</span>
                  </li>
                ))}
                <li className="nt-tile" style={{ '--n': ITEMS.length } as CSSProperties}>
                  <span className="nt-icon sq nt-add">
                    <svg viewBox="0 0 24 24" {...stroke}>
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </span>
                  <span className="nt-label">Add</span>
                </li>
              </ul>
            )}
          </div>

          {dock && (
            <div className="nt-dock">
              {ITEMS.map((item, n) => (
                <span key={item.title} className="nt-tile" style={{ '--n': n } as CSSProperties}>
                  <Icon kind={item.kind} title={item.title} />
                </span>
              ))}
              <span className="nt-dock-divider" />
              <span className="nt-tile" style={{ '--n': ITEMS.length } as CSSProperties}>
                <span className="nt-icon sq nt-apps">
                  <svg viewBox="0 0 24 24" {...stroke}>
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
