import { asset } from '../config'
import { Fragment, type CSSProperties } from 'react'
import { ArrowDownIcon, EyeOffIcon, HeartIcon, UserOffIcon } from './Icons'
import { AddButton } from './Install'
import { NewTabMock } from './NewTabMock'
import { useBrowser } from '../lib/browser'

export function Nav() {
  return (
    <header className="nav">
      <nav className="nav-inner wrap" aria-label="Main">
        <a className="brand" href="#top" aria-label="YourTab, back to top">
          <img src={asset('logo.svg')} alt="" width="30" height="30" />
          <span>YourTab</span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#privacy">Privacy</a>
          </li>
          <li>
            <a href="#faq">FAQ</a>
          </li>
        </ul>
        <div className="nav-cta">
          <AddButton size="sm" note={false} />
        </div>
      </nav>
    </header>
  )
}

/** "A new tab page for Edge", or whichever browser is visiting. */
function HeroBadge() {
  const browser = useBrowser()
  return (
    <p className="hero-badge">
      <img src={asset('favicon.svg')} alt="" width="16" height="16" />
      {browser.store ? `A new tab page for ${browser.name}` : 'A new tab page for Chrome and Firefox'}
    </p>
  )
}

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-aura" aria-hidden="true" />
      <div className="wrap hero-inner">
        <HeroBadge />
        <h1 className="h1 hero-title" id="hero-title">
          {['Make', 'every', 'new', 'tab'].map((w, i) => (
            <Fragment key={w}>
              <span className="word" style={{ '--i': i } as CSSProperties}>
                {w}
              </span>{' '}
            </Fragment>
          ))}
          <span className="grad-text word" style={{ '--i': 4 } as CSSProperties}>
            feel like home.
          </span>
        </h1>
        <p className="lead hero-lead">Shortcuts, search, notes, to-dos and games in one place. No account. No tracking.</p>
        <div className="hero-actions">
          <AddButton suffix=" — it's free" size="lg" />
          <a className="link-arrow" href="#features">
            See features
            <ArrowDownIcon size={18} />
          </a>
        </div>
      </div>
      <div className="wrap hero-shot">
        <NewTabMock
          intro
          className="hero-mock"
          settings={{ layout: 'dock', wallpaper: 'video', text: 'Shivaraj Padala' }}
          label="The YourTab new tab page over a video wallpaper: the time and date, a large Shivaraj Padala headline, a search bar, and a dock of shortcuts along the bottom."
        />
      </div>
    </section>
  )
}

const TRUST = [
  { icon: UserOffIcon, title: 'No account', text: 'Nothing to sign up for. Install it and open a tab.' },
  { icon: EyeOffIcon, title: 'No tracking', text: 'No analytics, no cookies. Nobody follows your clicks.' },
  { icon: HeartIcon, title: 'Free', text: 'Every feature, no paid version, nothing to unlock.' },
]

export function TrustStrip() {
  return (
    <section className="trust" aria-label="At a glance">
      <ul className="wrap trust-list">
        {TRUST.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="trust-card reveal" style={{ transitionDelay: `${i * 90}ms` }}>
            <span className="trust-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <span className="trust-copy">
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
