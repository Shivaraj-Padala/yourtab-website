import { CHROME_WEB_STORE_URL, FIREFOX_ADDONS_URL } from '../config'
import { useBrowser } from '../lib/browser'
import { DeviceIcon, PlusIcon } from './Icons'

interface Props {
  /** The words after "Add to {browser}", e.g. " — it's free". */
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  /** Show the "desktop extension" note on phones and tablets (off for the nav). */
  note?: boolean
}

/**
 * "Add to Chrome", "Add to Edge", "Add to Firefox"… for whichever browser is visiting, linking to
 * the store that browser installs from. Safari gets a short note instead, and phones and tablets
 * a note that YourTab is a desktop extension (CSS decides).
 */
export function AddButton({ suffix = '', size = 'md', note = true }: Props) {
  const browser = useBrowser()
  const cls = `btn btn-primary install-desktop${size === 'md' ? '' : ` btn-${size}`}`

  const mobileNote = note && (
    <p className="install-note">
      <DeviceIcon size={20} />
      <span>YourTab is a browser extension for desktop. Open this page on your computer to add it.</span>
    </p>
  )

  if (!browser.store) {
    if (size === 'sm') return null
    return (
      <>
      <p className="install-note install-note--any">
        <DeviceIcon size={20} />
        <span>
          YourTab isn't available for Safari. Open this page in{' '}
          <a className="text-link" href={CHROME_WEB_STORE_URL}>
            Chrome, Edge or Brave
          </a>{' '}
          or{' '}
          <a className="text-link" href={FIREFOX_ADDONS_URL}>
            Firefox
          </a>{' '}
          to add it.
        </span>
      </p>
      {mobileNote}
      </>
    )
  }

  return (
    <>
      <a className={cls} href={browser.store}>
        <PlusIcon size={size === 'sm' ? 16 : 18} strokeWidth={2.2} />
        Add to {browser.name}
        {suffix}
      </a>
      {mobileNote}
    </>
  )
}

/** The other store, for people on a browser YourTab also supports. */
export function OtherStore() {
  const browser = useBrowser()
  if (!browser.store) return null
  return browser.id === 'firefox' ? (
    <p className="final-alt install-desktop">
      Using Chrome, Edge or Brave?{' '}
      <a className="text-link" href={CHROME_WEB_STORE_URL}>
        Get it from the Chrome Web Store
      </a>
    </p>
  ) : (
    <p className="final-alt install-desktop">
      Using Firefox?{' '}
      <a className="text-link" href={FIREFOX_ADDONS_URL}>
        Get the Firefox version
      </a>
    </p>
  )
}
