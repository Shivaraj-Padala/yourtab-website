// "You'll love typing": the extension's search bar typing by itself. Every key pops out as a
// keycap (flyingKeys.ts), and the answers appear the way the extension shows them: worked out
// locally (answers.ts), your shortcuts with an autocomplete, and a row to search the web.
// Enter copies an answer ("Copied ✓").
import { useRef, useState } from 'react'
import { textWidth } from '../lib/flyingKeys'
import { useReducedMotion } from '../lib/hooks'
import { useTypingDemo } from '../lib/typingDemo'
import { useInView } from '../lib/useInView'

type Kind = 'calc' | 'convert' | 'time'
interface Answer {
  kind: Kind
  title: string
  detail: string
}

/** The time in Tokyo, the way the extension's quick answer writes it (answers.ts: timeIn). */
function tokyo(): Answer {
  const now = new Date()
  const zone = 'Asia/Tokyo'
  const time = new Intl.DateTimeFormat(undefined, { timeZone: zone, hour: 'numeric', minute: '2-digit' })
    .format(now)
    .replace(/\b([ap])\.?\s?m\.?(?=\s|$)/gi, (_, x: string) => `${x.toUpperCase()}M`)
  const day = new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: 'short' }).format(now)
  const there = new Date(now.toLocaleString('en-US', { timeZone: zone })).getTime()
  const here = new Date(now.toLocaleString('en-US')).getTime()
  const diff = Math.round((there - here) / 60000)
  const rel =
    diff === 0 ? 'same as you' : `${diff > 0 ? '+' : '−'}${Math.floor(Math.abs(diff) / 60)}h${Math.abs(diff) % 60 ? ` ${Math.abs(diff) % 60}m` : ''} from you`
  return { kind: 'time', title: `${time} · ${day}`, detail: `Tokyo · ${rel}` }
}

// what gets typed, and the answers the extension gives for them (checked against answers.ts)
const ANSWERS: Record<string, () => Answer> = {
  '15% of 80': () => ({ kind: 'calc', title: '= 12', detail: '15% of 80' }),
  'sqrt(144) + 2^3': () => ({ kind: 'calc', title: '= 20', detail: 'sqrt(144) + 2 ^ 3' }),
  '5 km in miles': () => ({ kind: 'convert', title: '3.10686 miles', detail: '5 km =' }),
  'time in tokyo': tokyo,
}
const SCRIPT = ['15% of 80', 'gi', '5 km in miles', 'time in tokyo', 'sqrt(144) + 2^3']
const SHORTCUT = { title: 'GitHub', host: 'github.com' }

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function AnswerIcon({ kind }: { kind: Kind }) {
  return (
    <span className="art-sr-icon sq">
      {kind === 'calc' && (
        <svg viewBox="0 0 24 24" {...line}>
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="16" x2="16" y1="14" y2="18" />
          <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
        </svg>
      )}
      {kind === 'convert' && (
        <svg viewBox="0 0 24 24" {...line}>
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
          <path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2" />
        </svg>
      )}
      {kind === 'time' && (
        <svg viewBox="0 0 24 24" {...line}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )}
    </span>
  )
}

const Enter = () => (
  <svg viewBox="0 0 24 24" {...line}>
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    <path d="m9 10-5 5 5 5" />
  </svg>
)

export function SearchArt() {
  const [view, inView] = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const layer = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const textEl = useRef<HTMLSpanElement>(null)
  // a still frame (no motion, or before it starts) shows a finished question with its answer
  const [text, setText] = useState('15% of 80')
  const [copied, setCopied] = useState(false)

  useTypingDemo({
    active: inView && !reduced,
    script: SCRIPT,
    layer,
    skin: '#fb542b',
    hold: 1900,
    setText: (t) => {
      setText(t)
      if (!t) setCopied(false)
    },
    onEnter: (t) => setCopied(t in ANSWERS),
    caret: (t) => {
      const l = layer.current?.getBoundingClientRect()
      const b = bar.current?.getBoundingClientRect()
      const tx = textEl.current
      if (!l || !b || !tx) return null
      return { x: tx.getBoundingClientRect().left - l.left + textWidth(tx, t), y: b.top - l.top + 4 }
    },
  })

  const answer = ANSWERS[text]?.()
  const shortcut = text.length > 0 && SHORTCUT.title.toLowerCase().startsWith(text) ? SHORTCUT : null
  const ghost = shortcut ? shortcut.title.slice(text.length) : ''

  return (
    <div className="art-search" ref={view}>
      <div className="art-layer art-search-layer" ref={layer}>
        <div className="art-bar" ref={bar}>
          <svg viewBox="0 0 24 24" {...line}>
            <path d="m21 21-4.34-4.34" />
            <circle cx="11" cy="11" r="8" />
          </svg>
          <span className="art-query">
            <span ref={textEl}>{text || <span className="art-ph">Search anything…</span>}</span>
            <i className="art-caret" />
            {ghost && <span className="art-ghost">{ghost}</span>}
          </span>
          <svg className="art-mic" viewBox="0 0 24 24" {...line}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>

        <div className={`art-results${text ? ' is-on' : ''}`}>
          {answer && (
            <div className="art-row is-active">
              <AnswerIcon kind={answer.kind} />
              <span className="art-sr-text">
                <span className="art-sr-answer">{answer.title}</span>
                <span className="art-sr-sub is-mono">{answer.detail}</span>
              </span>
              <span className="art-sr-hint">
                {copied ? (
                  'Copied ✓'
                ) : (
                  <>
                    copy <Enter />
                  </>
                )}
              </span>
            </div>
          )}
          {shortcut && (
            <div className="art-row is-active">
              <span className="art-sr-tile sq">G</span>
              <span className="art-sr-text">
                <span className="art-sr-title">{shortcut.title}</span>
                <span className="art-sr-sub">{shortcut.host}</span>
              </span>
              <span className="art-sr-hint">
                open <Enter />
              </span>
            </div>
          )}
          <div className="art-row">
            <span className="art-sr-icon art-sr-icon--web sq">
              <svg viewBox="0 0 24 24" {...line}>
                <path d="m21 21-4.34-4.34" />
                <circle cx="11" cy="11" r="8" />
              </svg>
            </span>
            <span className="art-sr-text">
              <span className="art-sr-title">Search Google</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
