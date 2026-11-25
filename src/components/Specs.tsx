// "Small in size. Big on features." Every figure here is measured from the extension's build
// (.output/chrome-mv3) or read from its code: keep them true when the extension changes.
const SPECS = [
  { value: '1.7 MB', text: 'The whole download, with nine typefaces and six games inside.' },
  { value: '0', text: 'Background tasks. YourTab only runs while a new tab is open.' },
  { value: 'Offline', text: 'Clock, notes, to-dos, quick answers and games all work without a connection.' },
  { value: 'Fast', text: 'Settings, Notes and the arcade load after your page appears, so the tab opens first.' },
]

export function Specs() {
  return (
    <section className="section specs" aria-labelledby="specs-title">
      <div className="wrap">
        <div className="section-head section-head--center reveal-head">
          <p className="eyebrow">Light and fast</p>
          <h2 className="h2" id="specs-title">
            Small in size. Big on features.
          </h2>
        </div>
        <ul className="specs-list">
          {SPECS.map((s) => (
            <li key={s.value} className="spec reveal">
              <span className="spec-value grad-text">{s.value}</span>
              <span className="spec-text">{s.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
