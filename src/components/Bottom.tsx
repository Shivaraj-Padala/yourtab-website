import { asset, CHROME_WEB_STORE_URL, FIREFOX_ADDONS_URL, GITHUB_URL, PRIVACY_URL } from '../config'
import { ChartOffIcon, CloudIcon, DeviceIcon, GithubIcon, HeartIcon, KeyIcon, SearchIcon } from './Icons'
import { AddButton, OtherStore } from './Install'

/* ───────── Privacy ───────── */

const POINTS = [
  {
    icon: DeviceIcon,
    title: 'Stored in your browser',
    text: 'Settings, notes, to-dos and wallpapers never leave this device.',
  },
  {
    icon: KeyIcon,
    title: 'No account',
    text: 'Nothing to sign up for. Install it and open a new tab.',
  },
  {
    icon: ChartOffIcon,
    title: 'No analytics, no tracking',
    text: 'Nobody counts your visits or follows your clicks.',
  },
  {
    icon: SearchIcon,
    title: 'One request, on your terms',
    text: 'Search suggestions are off until you turn them on. Then what you type goes to the engine you picked, without cookies.',
  },
]

export function Privacy() {
  return (
    <section className="section privacy" id="privacy" aria-labelledby="privacy-title">
      <div className="wrap">
        <div className="section-head section-head--center reveal-head">
          <p className="eyebrow">Privacy</p>
          <h2 className="h2" id="privacy-title">
            Your new tab <span className="hl">stays yours.</span>
          </h2>
          <p className="lead">Everything stays on your device. That's the whole story.</p>
        </div>

        <div className="flow reveal" aria-hidden="true">
          <div className="flow-box">
            <span className="flow-title">
              <DeviceIcon size={18} />
              Your browser
            </span>
            <span className="flow-chips">
              <i>Settings</i>
              <i>Notes</i>
              <i>To-dos</i>
              <i>Wallpapers</i>
            </span>
          </div>
          <div className="flow-line">
            <span>Opt-in suggestions · no cookies</span>
          </div>
          <div className="flow-box flow-box--engine">
            <span className="flow-title">
              <CloudIcon size={18} />
              Your search engine
            </span>
            <span className="flow-chips">
              <i>Google</i>
              <i>Bing</i>
              <i>Brave</i>
              <i>DuckDuckGo</i>
            </span>
          </div>
        </div>

        <ul className="points">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="point reveal">
              <span className="point-icon">
                <Icon size={22} />
              </span>
              <h3 className="h3">{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ───────── FAQ ───────── */

const FAQ = [
  {
    q: 'Is it free?',
    a: <p>Yes. YourTab is free, with no paid version and nothing to unlock.</p>,
  },
  {
    q: 'Does it need an account?',
    a: <p>No. There is nothing to sign up for. Add it to your browser and open a new tab.</p>,
  },
  {
    q: 'Where is my data stored?',
    a: (
      <p>
        In your browser, on your device. Your settings, notes, to-dos and wallpapers never leave it. If you turn on search
        suggestions, what you type in search goes to the search engine you chose, without cookies, so it can suggest results.
      </p>
    ),
  },
  {
    q: 'Which browsers does it support?',
    a: (
      <p>
        Chrome, Edge, Brave and other Chromium browsers install it from the{' '}
        <a className="text-link" href={CHROME_WEB_STORE_URL}>
          Chrome Web Store
        </a>
        . There is also a version for{' '}
        <a className="text-link" href={FIREFOX_ADDONS_URL}>
          Firefox
        </a>
        . It runs on desktop computers.
      </p>
    ),
  },
  {
    q: 'Can I use my own search engine?',
    a: (
      <p>
        You can choose the engine YourTab searches with: Google, Bing, Brave Search or DuckDuckGo. Suggestions from it are off
        until you turn them on.
      </p>
    ),
  },
  {
    q: 'How do I remove it?',
    a: (
      <p>
        Right-click the YourTab icon in your toolbar and choose <strong>Remove from Chrome</strong>, or open{' '}
        <code>chrome://extensions</code> and click <strong>Remove</strong>. Your new tab goes back to the default, and everything
        YourTab stored is removed with it. To start over without removing it, use <strong>Settings → Reset YourTab</strong>.
      </p>
    ),
  },
]

export function Faq() {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <div className="section-head reveal-head">
          <p className="eyebrow">FAQ</p>
          <h2 className="h2" id="faq-title">
            Questions, answered.
          </h2>
        </div>
        <div className="faq-list reveal">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="qa" name="faq">
              <summary>
                <span className="qa-q">{q}</span>
                <span className="qa-mark" aria-hidden="true" />
              </summary>
              <div className="qa-body">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────── Final call to action ───────── */

export function FinalCta() {
  return (
    <section className="final" aria-labelledby="final-title">
      <div className="wrap">
        <div className="final-card reveal-zoom">
          <img className="final-logo" src={asset('logo.svg')} alt="" width="104" height="104" />
          <h2 className="h2" id="final-title">
            Make every new tab <span className="grad-text">feel like home.</span>
          </h2>
          <p className="lead">Free, private, and ready in a few seconds.</p>
          <div className="final-actions">
            <AddButton size="lg" />
          </div>
          <OtherStore />
        </div>
      </div>
    </section>
  )
}

/* ───────── Footer ───────── */

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p className="footer-brand">
          <img src={asset('favicon.svg')} alt="" width="20" height="20" />
          <span>© {YEAR} YourTab</span>
          <span className="made-with">
            Made with
            <HeartIcon size={14} className="made-heart" aria-label="love" role="img" aria-hidden={undefined} />
          </span>
        </p>
        <ul className="footer-links">
          <li>
            <a href={PRIVACY_URL}>Privacy policy</a>
          </li>
          <li>
            <a href={GITHUB_URL}>
              <GithubIcon size={17} />
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
