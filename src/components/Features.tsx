// The features bento. Each tile has a small live illustration drawn the way the extension draws
// it. The illustrations are decorative; each tile's text says it all.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/hooks'
import { useInView } from '../lib/useInView'
import { ArcadeArt } from './ArcadeArt'
import { ArrowRightIcon } from './Icons'
import { SearchArt } from './SearchArt'

function Tile({
  className,
  art,
  title,
  children,
  interactive,
}: {
  className: string
  art: ReactNode
  title: string
  children: ReactNode
  /** the picture has controls of its own (it describes itself to screen readers) */
  interactive?: boolean
}) {
  return (
    <article className={`tile ${className} reveal`}>
      <div className="tile-art" aria-hidden={interactive ? undefined : 'true'}>
        {art}
      </div>
      <div className="tile-copy">
        <h3 className="h3">{title}</h3>
        {children}
      </div>
    </article>
  )
}

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/* ───────── Shortcuts: drop one on another to make a folder ───────── */

function ShortcutsArt() {
  return (
    <div className="art-merge">
      <div className="art-merge-grid">
        <span className="art-sc sq">G</span>
        <span className="art-sc sq">Y</span>
        <span className="art-sc sq">M</span>
        <span className="art-sc sq art-merge-target">X</span>
        <span className="art-sc sq art-merge-drag">R</span>
        <span className="art-sc sq">W</span>
        <span className="art-sc sq art-sc-folder art-merge-folder">
          <i>X</i>
          <i>R</i>
        </span>
      </div>
      <span className="art-chip art-merge-hint">New folder</span>
    </div>
  )
}

/* ───────── Display Text: the four animated styles ───────── */

const DT_STYLES = [
  { id: 'shimmer', name: 'Shimmer', palette: 'Accent', colors: ['#fb542b', '#ff8a3d', '#e5245a'] },
  { id: 'aurora', name: 'Aurora', palette: 'Cosmic', colors: ['#7048e8', '#e64980', '#4c6ef5'] },
  { id: 'glow', name: 'Glow', palette: 'Ocean', colors: ['#1c7ed6', '#15aabf', '#5c7cfa'] },
  { id: 'spotlight', name: 'Spotlight', palette: 'Sunset', colors: ['#ff5e62', '#ff9966', '#e8467c'] },
]

function DisplayArt() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView || reduced) return
    const t = window.setInterval(() => setN((x) => (x + 1) % DT_STYLES.length), 3600)
    return () => clearInterval(t)
  }, [inView, reduced])
  const st = DT_STYLES[n]
  const [c1, c2, c3] = st.colors
  return (
    <div className="art-display" ref={ref}>
      <span
        key={st.id}
        className={`nt-dt dt-${st.id} art-dt`}
        data-text="Hello"
        style={{ '--c1': c1, '--c2': c2, '--c3': c3, '--fg': 'var(--text)' } as CSSProperties}
      >
        <span className="nt-dt-text">Hello</span>
      </span>
      <span className="art-dt-meta">
        <span className="art-chip">{st.name}</span>
        <span className="art-chip">
          <i style={{ background: `linear-gradient(135deg, ${st.colors.join(', ')})` }} />
          {st.palette}
        </span>
      </span>
    </div>
  )
}

/* ───────── Notes & To-dos ───────── */

function NotesArt() {
  return (
    <div className="art-notes">
      <div className="art-note">
        <b>
          Weekend
          <svg viewBox="0 0 24 24" {...line} className="art-pin">
            <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </svg>
        </b>
        <i style={{ width: '82%' }} />
        <i style={{ width: '64%' }} />
        <i style={{ width: '74%' }} />
      </div>
      <ul className="art-todos">
        {['Water the plants', 'Book a table', 'Reply to Sam'].map((t, n) => (
          <li key={t} style={{ animationDelay: `${n * 0.9}s` }}>
            <span className="art-check" style={{ animationDelay: `${n * 0.9}s` }}>
              <svg viewBox="0 0 24 24">
                <path d="m7 12.5 3.2 3.2L17 9" />
              </svg>
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────── Privacy ───────── */

function PrivacyArt() {
  return (
    <dl className="art-privacy">
      <div>
        <dt>Data collected</dt>
        <dd>None</dd>
      </div>
      <div>
        <dt>Account</dt>
        <dd>Not needed</dd>
      </div>
      <div>
        <dt>Your data</dt>
        <dd>On this device</dd>
      </div>
    </dl>
  )
}

export function Features() {
  return (
    <section className="section features" id="features" aria-labelledby="features-title">
      <div className="wrap">
        <div className="section-head reveal-head">
          <p className="eyebrow">Features</p>
          <h2 className="h2" id="features-title">
            Everything you reach for, right where you start.
          </h2>
          <p className="lead">Small, well-made tools, ready the moment a tab opens.</p>
        </div>

        <div className="bento">
          <Tile className="tile--search" art={<SearchArt />} title="You'll love typing">
            <p>
              Answers show up as you type, worked out right on your device. Every key pops out as a little keycap, and Enter copies
              the answer.
            </p>
            <dl className="search-facts">
              <div>
                <dt>Calculator</dt>
                <dd>Functions, constants and percentages</dd>
              </div>
              <div>
                <dt>Units</dt>
                <dd>Length, weight, volume, speed, data, area, time and temperature</dd>
              </div>
              <div>
                <dt>World time</dt>
                <dd>Cities around the world, and how far ahead they are</dd>
              </div>
              <div>
                <dt>Your shortcuts</dt>
                <dd>Found as you type, even inside folders</dd>
              </div>
              <div>
                <dt>Suggestions</dt>
                <dd>Live from Google, Bing, Brave or DuckDuckGo</dd>
              </div>
            </dl>
          </Tile>

          <Tile className="tile--shortcuts" art={<ShortcutsArt />} title="Shortcuts that act like apps">
            <p>Drop one onto another to make a folder. Keep them in a grid, or in a dock with an All apps drawer.</p>
          </Tile>

          <Tile className="tile--arcade" art={<ArcadeArt />} title="Six games, built in" interactive>
            <p>
              While the search bar sits empty, a game plays itself inside it. Open the arcade to play any of them with your keyboard,
              even offline. Pick one above to watch it play.
            </p>
          </Tile>

          <Tile className="tile--display" art={<DisplayArt />} title="Your name, in lights">
            <p>A big headline across your page in Shimmer, Aurora, Glow or Spotlight, with a dozen palettes to choose from.</p>
          </Tile>



          <Tile className="tile--notes" art={<NotesArt />} title="Notes and to-dos, a click away">
            <p>Pin the notes that matter, keep a list for everything, and see changes in every open tab.</p>
          </Tile>

          <Tile className="tile--privacy" art={<PrivacyArt />} title="Private by design">
            <p>
              Everything stays in your browser.{' '}
              <a className="text-link" href="#privacy">
                How it works
              </a>
            </p>
          </Tile>
        </div>

        <p className="features-more reveal">
          <a className="link-arrow link-arrow--right" href="#customize">
            Try it all in the playground
            <ArrowRightIcon size={18} />
          </a>
        </p>
      </div>
    </section>
  )
}
