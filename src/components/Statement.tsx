// Three words that light up one by one as you scroll past (styles/motion.css). Each word has a
// lit copy laid over it that fades in, so the effect only animates opacity. Without scroll-driven
// animations, or with reduced motion, the words simply show lit.
import type { CSSProperties } from 'react'

const WORDS = ['Calm.', 'Useful.', 'Yours.']

export function Statement() {
  return (
    <section className="statement" aria-label="YourTab in three words">
      <div className="statement-sticky">
        <p className="wrap statement-text">
          {WORDS.map((w, i) => (
            <span key={w}>
              <span
                className={`lit${i === WORDS.length - 1 ? ' lit--brand' : ''}`}
                data-w={w}
                style={{ '--from': `${8 + i * 28}%`, '--to': `${26 + i * 28}%` } as CSSProperties}
              >
                {w}
              </span>{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
