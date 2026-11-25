# YourTab website

The product page for [YourTab](../yourtab), the new tab extension. One static page, built with
Vite + React and prerendered to plain HTML at build time. No backend, no trackers, no cookies.

## Develop

```sh
pnpm install
pnpm dev        # local dev server with hot reload
pnpm build      # type-check, build, and prerender into dist/
pnpm preview    # serve dist/ locally
pnpm lint
```

`dist/` is a static site: upload it to any static host.

## Before launch

Replace the placeholders in [`src/config.ts`](src/config.ts):

| Constant               | What it should be                     |
| ---------------------- | ------------------------------------- |
| `CHROME_WEB_STORE_URL` | the Chrome Web Store listing          |
| `FIREFOX_ADDONS_URL`   | the Firefox Add-ons listing           |
| `GITHUB_URL`           | the source repository                 |

The install button names the visitor's browser ("Add to Edge", "Add to Firefox"…) and links to
the store it installs from ([`src/lib/browser.ts`](src/lib/browser.ts)); Safari visitors get a
note instead. The prerendered page says "Add to Chrome" until the script runs.

**The hero's video wallpaper** is `public/media/wallpaper.webm` (VP9, 1280×720, about 1.6 MB) with
`public/media/wallpaper-poster.jpg` as its first frame. Replace both files to change it; make
sure you have the rights to whatever footage you use. Keep it short (10–15 s) and small.

Set `VITE_SITE_URL` in [`.env`](.env) to the site's address (no trailing slash) so the Open
Graph and Twitter card URLs are absolute. Social networks need absolute URLs for the preview image.

## How it's put together

```
index.html               head: title, description, Open Graph, favicon
src/
  App.tsx                the page, section by section
  components/
    Top.tsx              nav, hero, trust strip
    NewTabMock.tsx       the extension's new tab page, rebuilt from its own CSS values (used twice)
    Statement.tsx        "Calm. Useful. Yours.", lit word by word as you scroll
    Features.tsx         the bento grid and its live illustrations
    Customize.tsx        "Make it yours": a playground with the extension's options
    FaceSvg.tsx          the Face's drawing (shared by FaceSection and the mock)
    FaceSection.tsx      the Face: eyes follow the cursor, blinks, winks, catches typed letters
    Bottom.tsx           privacy, FAQ, final call to action, footer
    Install.tsx          "Add to Chrome", or a desktop-only note on phones and tablets
  lib/color.ts           a port of the extension's contrast engine
  lib/wallpapers.ts      the extension's gradients (exact CSS), plain colors, video
  lib/mock.ts            the settings the mock understands, and a fresh install's defaults
  lib/fonts.ts           the 10 typefaces; each loads only when picked in the playground
  lib/browser.ts         which browser is visiting, and where it installs from
  lib/flyingKeys.ts      the extension's flying keys (and the Face eating them), ported
  lib/typingDemo.ts      types into a demo search bar, launching a key per keystroke
  lib/arcade/            the extension's six games, copied as-is (keep in sync with src/app/widgets/arcade)
  lib/motion.ts          reveals sections as they scroll into view; pauses off-screen loops
  styles/                base tokens, sections, the mock, the bento illustrations
  entry-server.tsx       renders the page to HTML at build time
scripts/
  prerender.mjs          puts the rendered HTML into dist/index.html
  og.html                source of public/og.png
public/
  logo.svg, favicon.svg  copied from the extension
  og.png                 1200 × 630 social image
  privacy.html           the privacy policy
```

**Colors.** Every text color is checked for WCAG AA. The brand orange `#fb542b` is used for
decoration, `--accent-ink` for orange text, and `--accent-fill` behind white text. The demo
derives a readable text shade for any accent, the same way the extension does.

**The mock new tab page** copies the extension's defaults and values from `src/app/App.css`,
`glass.css`, `shortcuts.css` and `display.css`. It's laid out as a 1280 px window and scaled with
container units (`--px` in `styles/mock.css`), so pixel values can be copied straight across. If
the extension's look changes, update `NewTabMock.tsx` and `mock.css` to match.

**Motion** lives in `styles/motion.css` and only animates opacity and transform, so it runs on
the GPU and never repaints the page while you scroll:
- the hero plays once on load, and the browser window "opens a new tab" with the extension's own
  entrance animations (page rise, Display Text out of a blur, shortcuts springing in);
- sections rise into place once as they come into view: time-based, triggered by
  `lib/motion.ts`, so they stay smooth whatever the scroll speed. Without JS nothing is hidden;
- only the three-word statement follows the scroll (CSS scroll timeline, opacity only);
- looping animations pause while off screen, and the Face only redraws while it's moving.

With `prefers-reduced-motion`, none of it runs.

**"Small in size" figures** in `src/components/Specs.tsx` are measured from the extension's build
(1.7 MB is the zipped `.output/chrome-mv3`). Re-check them when the extension changes.

**Mobile.** At 767px and below, or on touch-only devices, "Add to Chrome" is replaced by a note
that YourTab is a desktop extension.

## Social image

`public/og.png` is a screenshot of `scripts/og.html` at exactly 1200 × 630. To change it, edit
the HTML, open it in Chrome with the window (or device toolbar) set to 1200 × 630, and capture
a screenshot to `public/og.png`.
