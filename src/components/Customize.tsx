// "Make it yours": a playground with the extension's own options. Every control changes the mock
// new tab page live, the same way Settings does in YourTab.
import { useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { FONTS, loadFont, type FontId } from '../lib/fonts'
import { GRADIENTS, PLAIN_COLORS, VIDEO, wallpaperLook, type GradientId, type WallpaperId } from '../lib/wallpapers'
import { MoonIcon, SunIcon } from './Icons'
import { DEFAULT_MOCK, PALETTES, type DisplayStyle, type MockSettings, type PaletteId } from '../lib/mock'
import { NewTabMock } from './NewTabMock'

// YourTab's suggested accents (settings/schema.ts ACCENTS)
const ACCENTS = [
  { name: 'Crimson', color: '#e5484d' },
  { name: 'Orange', color: '#fb542b' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Sunflower', color: '#ffc61a' },
  { name: 'Lime', color: '#8fc73e' },
  { name: 'Green', color: '#30a46c' },
  { name: 'Teal', color: '#12a594' },
  { name: 'Cyan', color: '#00a2c7' },
  { name: 'Blue', color: '#007aff' },
  { name: 'Indigo', color: '#5b5bd6' },
  { name: 'Violet', color: '#8e4ec6' },
  { name: 'Orchid', color: '#ab4aba' },
  { name: 'Magenta', color: '#d6409f' },
  { name: 'Pink', color: '#e93d82' },
  { name: 'Mocha', color: '#a07553' },
  { name: 'Slate', color: '#697586' },
]
const STYLES: { id: DisplayStyle; name: string }[] = [
  { id: 'shimmer', name: 'Shimmer' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'glow', name: 'Glow' },
  { id: 'spotlight', name: 'Spotlight' },
  { id: 'static', name: 'Static' },
]
const GRADIENT_IDS = Object.keys(GRADIENTS) as GradientId[]
const WALLPAPERS: WallpaperId[] = ['video', 'default', 'plain', ...GRADIENT_IDS, ...PLAIN_COLORS.map((c) => c.id)]

type Tab = 'colors' | 'wallpaper' | 'home' | 'headline'
const TABS: { id: Tab; name: string }[] = [
  { id: 'colors', name: 'Colors' },
  { id: 'wallpaper', name: 'Wallpaper' },
  { id: 'home', name: 'Home' },
  { id: 'headline', name: 'Headline' },
]

const DARK = '(prefers-color-scheme: dark)'
const subscribe = (fn: () => void) => {
  const mq = window.matchMedia(DARK)
  mq.addEventListener('change', fn)
  return () => mq.removeEventListener('change', fn)
}
const useSystemTheme = () =>
  useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(DARK).matches ? ('dark' as const) : ('light' as const)),
    () => 'light' as const,
  )

const START: Partial<MockSettings> = { wallpaper: 'default' }

/** One tab, many personalities: ready-made combinations of real settings. */
const MOODS: { name: string; swatch: string; set: Partial<MockSettings> }[] = [
  {
    name: 'Calm',
    swatch: 'linear-gradient(135deg, #f6f8fb, #d6e2f2)',
    set: { theme: 'light', wallpaper: 'porcelain', accent: '#007aff', glass: true, font: 'inter', layout: 'grid', shape: 'squircle', style: 'shimmer', palette: 'ocean', face: false },
  },
  {
    name: 'Night owl',
    swatch: 'linear-gradient(135deg, #121214, #6b5636)',
    set: { theme: 'dark', wallpaper: 'obsidian', accent: '#f59e0b', glass: true, font: 'geist', layout: 'dock', shape: 'squircle', style: 'glow', palette: 'gold', face: false },
  },
  {
    name: 'Cinematic',
    swatch: `#101818 url(${VIDEO.poster}) center / cover`,
    set: { theme: 'dark', wallpaper: 'video', accent: '#12a594', glass: true, font: 'outfit', layout: 'dock', shape: 'circle', style: 'spotlight', palette: 'lagoon', face: false },
  },
  {
    name: 'Playful',
    swatch: 'linear-gradient(135deg, #e93d82, #ff8a3d)',
    set: { theme: 'light', accent: '#e93d82', font: 'nunito-sans', layout: 'grid', shape: 'circle', face: true },
  },
  {
    name: 'Bold',
    swatch: 'linear-gradient(135deg, #150d14, #6e1d3a, #35184a)',
    set: { theme: 'dark', wallpaper: 'velvet', accent: '#d6409f', glass: true, font: 'montserrat', layout: 'grid', shape: 'circle', style: 'aurora', palette: 'berry', face: false },
  },
]
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

/** A preview of a wallpaper, for its swatch. */
function wallpaperPreview(id: WallpaperId, accent: string): CSSProperties {
  if (id === 'video') return { background: `#101818 url(${VIDEO.poster}) center / cover` }
  if (id === 'default')
    return {
      background: `radial-gradient(80% 70% at 30% 10%, color-mix(in srgb, ${accent} 45%, transparent), transparent 70%), radial-gradient(60% 60% at 90% 100%, color-mix(in srgb, ${accent} 25%, transparent), transparent 70%), var(--surface)`,
    }
  if (id === 'plain') return { background: 'linear-gradient(135deg, #ffffff 50%, #202124 50%)' }
  return { background: wallpaperLook(id).css! }
}

/* small building blocks */
function Group({ label, children, note }: { label: string; children: ReactNode; note?: ReactNode }) {
  return (
    <fieldset className="pg-group">
      <legend>{label}</legend>
      {children}
      {note && <p className="pg-note">{note}</p>}
    </fieldset>
  )
}
function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: { id: T; name: string; icon?: ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <label key={o.id}>
          <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
          <span>
            {o.icon}
            {o.name}
          </span>
        </label>
      ))}
    </div>
  )
}
function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="pg-row">
      <span className="pg-row-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <button type="button" className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
        <span />
      </button>
    </div>
  )
}

export function Customize() {
  const system = useSystemTheme()
  const [picked, setPicked] = useState<Partial<MockSettings>>(START)
  const [mood, setMood] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('colors')
  const s: MockSettings = { ...DEFAULT_MOCK, theme: system, ...picked }
  const set = (patch: Partial<MockSettings>) => {
    setMood(null)
    setPicked((p) => ({ ...p, ...patch }))
  }
  const wear = (m: (typeof MOODS)[number]) => {
    if (m.set.font) loadFont(m.set.font)
    setMood(m.name)
    setPicked((p) => ({ ...p, ...m.set }))
  }

  const look = wallpaperLook(s.wallpaper)
  const preset = ACCENTS.find((a) => a.color === s.accent)

  const setFont = (font: FontId) => {
    loadFont(font)
    set({ font })
  }
  const shuffle = () => {
    const font = pick(FONTS).id
    loadFont(font)
    setMood(null)
    setPicked((p) => ({
      ...p,
      accent: pick(ACCENTS).color,
      wallpaper: pick(WALLPAPERS),
      style: pick(STYLES).id,
      palette: pick(PALETTES).id,
      shape: pick(['squircle', 'circle'] as const),
      layout: pick(['grid', 'dock'] as const),
      font,
      face: false,
    }))
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null
    if (next === null) return
    e.preventDefault()
    const t = TABS[(next + TABS.length) % TABS.length]
    setTab(t.id)
    document.getElementById(`pg-tab-${t.id}`)?.focus()
  }

  return (
    <section className="section customize" id="customize" aria-labelledby="customize-title">
      <div className="wrap">
        <div className="section-head section-head--center reveal-head">
          <p className="eyebrow">Make it yours</p>
          <h2 className="h2" id="customize-title">
            One tab. Many personalities.
          </h2>
          <p className="lead">Start with a mood, then make it yours. Every option here is one YourTab has.</p>
        </div>

        <div className="moods reveal" role="group" aria-label="Moods">
          {MOODS.map((m) => (
            <button key={m.name} type="button" className="mood" aria-pressed={mood === m.name} onClick={() => wear(m)}>
              <i style={{ background: m.swatch }} />
              {m.name}
            </button>
          ))}
        </div>

        <div className="playground reveal-zoom">
          <div className="pg-stage">
            <NewTabMock
              intro
              feedDemo
              settings={s}
              label={`Preview of your YourTab page: ${look.name} wallpaper, ${preset?.name.toLowerCase() ?? 'custom'} accent, ${s.theme} theme.`}
            />
          </div>

          <div className="pg-panel">
            <div className="pg-tabs" role="tablist" aria-label="Settings">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  id={`pg-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`pg-panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={onTabKey}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="pg-body">
              {tab === 'colors' && (
                <div role="tabpanel" id="pg-panel-colors" aria-labelledby="pg-tab-colors" className="pg-tabpanel">
                  <Group label="Theme">
                    <Segmented
                      name="pg-theme"
                      value={s.theme === 'dark' ? 'dark' : 'light'}
                      options={[
                        { id: 'light', name: 'Light', icon: <SunIcon size={16} /> },
                        { id: 'dark', name: 'Dark', icon: <MoonIcon size={16} /> },
                      ]}
                      onChange={(theme) => set({ theme })}
                    />
                  </Group>
                  <Group label="Accent">
                    <div className="swatches">
                      {ACCENTS.map((a) => (
                        <label key={a.color} className="swatch" style={{ '--sw': a.color } as CSSProperties} title={a.name}>
                          <input type="radio" name="pg-accent" value={a.color} checked={s.accent === a.color} onChange={() => set({ accent: a.color })} />
                          <span className="sr-only">{a.name}</span>
                        </label>
                      ))}
                      <label
                        className={`swatch swatch--custom${preset ? '' : ' is-on'}`}
                        style={{ '--sw': preset ? undefined : s.accent } as CSSProperties}
                        title="Any color"
                      >
                        <input type="color" value={s.accent} onChange={(e) => set({ accent: e.target.value })} aria-label="Pick any color" />
                      </label>
                    </div>
                  </Group>
                  <Switch label="Frosted glass" hint="See-through bars and tiles" checked={s.glass} onChange={(glass) => set({ glass })} />
                  <Group label="Typeface">
                    <div className="pg-chips">
                      {FONTS.map((f) => (
                        <label key={f.id} className="pg-chip">
                          <input type="radio" name="pg-font" value={f.id} checked={s.font === f.id} onChange={() => setFont(f.id)} />
                          <span>{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </Group>
                </div>
              )}

              {tab === 'wallpaper' && (
                <div role="tabpanel" id="pg-panel-wallpaper" aria-labelledby="pg-tab-wallpaper" className="pg-tabpanel">
                  <Group label={`Wallpaper · ${look.name}`} note="Or use a photo or video of your own. It stays in your browser.">
                    <div className="pg-walls">
                      {WALLPAPERS.map((id) => (
                        <label key={id} className="pg-wall" style={wallpaperPreview(id, s.accent)} title={wallpaperLook(id).name}>
                          <input type="radio" name="pg-wall" value={id} checked={s.wallpaper === id} onChange={() => set({ wallpaper: id, face: false })} />
                          <span className="sr-only">{wallpaperLook(id).name}</span>
                          {id === 'video' && (
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M8 5.5v13l10.5-6.5z" fill="#fff" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </Group>
                  {s.wallpaper === 'video' && (
                    <div className="pg-sliders">
                      <label className="pg-slider">
                        <span>Dim</span>
                        <input type="range" min="0" max="0.8" step="0.05" value={s.dim} onChange={(e) => set({ dim: Number(e.target.value) })} />
                      </label>
                      <label className="pg-slider">
                        <span>Blur</span>
                        <input type="range" min="0" max="16" step="1" value={s.blur} onChange={(e) => set({ blur: Number(e.target.value) })} />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {tab === 'home' && (
                <div role="tabpanel" id="pg-panel-home" aria-labelledby="pg-tab-home" className="pg-tabpanel">
                  <Group label="Shortcuts">
                    <Segmented
                      name="pg-layout"
                      value={s.layout}
                      options={[
                        { id: 'grid', name: 'Grid' },
                        { id: 'dock', name: 'Dock' },
                      ]}
                      onChange={(layout) => set({ layout })}
                    />
                  </Group>
                  <Group label="Icon shape">
                    <Segmented
                      name="pg-shape"
                      value={s.shape}
                      options={[
                        { id: 'squircle', name: 'Squircle' },
                        { id: 'circle', name: 'Circle' },
                      ]}
                      onChange={(shape) => set({ shape })}
                    />
                  </Group>
                  <Switch label="24-hour clock" checked={s.clock24} onChange={(clock24) => set({ clock24 })} />
                  <Switch label="The Face" hint="Fills the page with your accent, and eats what you type" checked={s.face} onChange={(face) => set({ face })} />
                </div>
              )}

              {tab === 'headline' && (
                <div role="tabpanel" id="pg-panel-headline" aria-labelledby="pg-tab-headline" className="pg-tabpanel">
                  <label className="pg-text">
                    <span>Display Text</span>
                    <input type="text" value={s.text} maxLength={18} placeholder="Your Name" onChange={(e) => set({ text: e.target.value, face: false })} />
                  </label>
                  <Group label="Style">
                    <div className="pg-chips">
                      {STYLES.map((st) => (
                        <label key={st.id} className="pg-chip">
                          <input type="radio" name="pg-style" value={st.id} checked={s.style === st.id} onChange={() => set({ style: st.id, face: false })} />
                          <span>{st.name}</span>
                        </label>
                      ))}
                    </div>
                  </Group>
                  {s.style !== 'static' && (
                    <Group label={`Palette · ${PALETTES.find((p) => p.id === s.palette)!.name}`}>
                      <div className="swatches">
                        {PALETTES.map((p) => (
                          <label
                            key={p.id}
                            className="swatch"
                            title={p.name}
                            style={
                              {
                                '--sw': p.colors
                                  ? `linear-gradient(135deg, ${p.colors.join(', ')})`
                                  : `linear-gradient(135deg, ${s.accent}, color-mix(in oklab, ${s.accent} 55%, #e5245a))`,
                              } as CSSProperties
                            }
                          >
                            <input type="radio" name="pg-palette" value={p.id} checked={s.palette === p.id} onChange={() => set({ palette: p.id as PaletteId, face: false })} />
                            <span className="sr-only">{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </Group>
                  )}
                </div>
              )}
            </div>

            <div className="pg-actions">
              <button type="button" className="pg-btn" onClick={shuffle}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m18 14 4 4-4 4M18 2l4 4-4 4" />
                  <path d="M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-8.6a4 4 0 0 1 3.3-1.7H22M2 6h1.97a4 4 0 0 1 3.3 1.7l.4.6M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45" />
                </svg>
                Shuffle
              </button>
              <button
                type="button"
                className="pg-btn pg-btn--quiet"
                onClick={() => {
                  setMood(null)
                  setPicked(START)
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {`${look.name} wallpaper, ${preset?.name ?? 'custom'} accent, ${s.theme} theme${s.face ? ', the Face on' : ''}.`}
          </p>
        </div>

      </div>
    </section>
  )
}
