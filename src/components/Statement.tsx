// Three words that light up one by one as you scroll past (styles/motion.css), each with a line
// that says what it means. Each word has a lit copy laid over it that fades in, so the effect only
// animates opacity (and the line, a small rise). Without scroll-driven animations, or with reduced
// motion, everything simply shows lit.
import type { CSSProperties } from 'react'

const WORDS = [
  { word: 'Calm.', line: 'No feeds, no ads, no headlines. Just a quiet page that opens instantly.' },
  { word: 'Useful.', line: 'Search, shortcuts, notes and to-dos, ready the moment a tab opens.' },
  { word: 'Yours.', line: 'Your name, your colors, your layout. Everything stays on your device.' },
]

export function Statement() {
  return (
    <section className="statement" aria-label="YourTab in three words">
      <div className="statement-sticky">
        <ol className="wrap statement-list">
          {WORDS.map(({ word, line }, i) => (
            <li
              key={word}
              className="statement-row"
              style={{ '--from': `${6 + i * 30}%`, '--to': `${24 + i * 30}%` } as CSSProperties}
            >
              <span className={`statement-word lit${i === WORDS.length - 1 ? ' lit--brand' : ''}`} data-w={word}>
                {word}
              </span>
              <p className="statement-line">{line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
